import path from 'path';
import fs from 'fs/promises';
import { env } from '../lib/env.js';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
import youtubedl from 'youtube-dl-exec';
import { ProcessamentoRepository } from '../repositories/processamento.repository.js';
import { VideoRepository } from '../repositories/video.repository.js';
import { ConfiguracaoService } from './configuracao.service.js';

ffmpeg.setFfmpegPath(ffmpegPath || 'ffmpeg');
if (ffprobePath && ffprobePath.path) {
  ffmpeg.setFfprobePath(ffprobePath.path);
}
type PosicaoMarcaDagua = 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT' | 'CENTER';

async function garantirDiretorio(destino: string) {
  await fs.mkdir(path.dirname(destino), { recursive: true });
}

async function baixarYoutube(url: string, arquivoDestino: string, qualidade: string = 'best', onProgress?: (percentual: number) => void) {
  await garantirDiretorio(arquivoDestino);

  // Mapeamento de qualidades comuns para formato youtube-dl, priorizando mp4 e m4a para garantir áudio
  let formatString = qualidade;
  if (qualidade === '1080p') formatString = 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best';
  else if (qualidade === '720p') formatString = 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best';
  else if (qualidade === '480p') formatString = 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]/best';
  else if (qualidade === '360p') formatString = 'bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/best[height<=360][ext=mp4]/best';
  else if (qualidade === 'maxima') formatString = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';

  try {
    // Usamos spawn para poder capturar o progresso via stdout
    const subprocess = youtubedl.exec(url, {
      output: arquivoDestino,
      format: formatString,
      mergeOutputFormat: 'mp4',
      ffmpegLocation: ffmpegPath || undefined,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'],
      newline: true, // Garante que cada atualização de progresso venha em uma nova linha
    });

    if (onProgress && subprocess.stdout) {
      subprocess.stdout.on('data', (data) => {
        const output = data.toString();
        // Procura por padrões como "[download]  10.5% of 100.00MiB"
        const match = output.match(/\[download\]\s+(\d+\.?\d*)%/);
        if (match) {
          const percent = parseFloat(match[1]);
          onProgress(percent);
        }
      });
    }

    await subprocess;
  } catch (erro) {
    console.warn('Tentativa com formato solicitado falhou, tentando melhor formato disponível:', erro);
    await youtubedl.exec(url, {
      output: arquivoDestino,
      format: 'best',
      mergeOutputFormat: 'mp4',
      ffmpegLocation: ffmpegPath || undefined,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36']
    });
  }
}

function obterPosicaoMarcaDagua(posicao: PosicaoMarcaDagua) {
  if (posicao === 'TOP_LEFT') return { x: 10, y: 10 };
  if (posicao === 'TOP_RIGHT') return { x: 'w-tw-10', y: 10 };
  if (posicao === 'CENTER') return { x: '(w-tw)/2', y: '(h-th)/2' };
  if (posicao === 'BOTTOM_RIGHT') return { x: 'w-tw-10', y: 'h-th-10' };
  return { x: 10, y: 'h-th-10' };
}

async function aplicarMarcaDagua(arquivoOriginal: string, arquivoSaida: string, posicaoMarcaDagua?: PosicaoMarcaDagua, onProgress?: (percentual: number) => void) {
  await garantirDiretorio(arquivoSaida);
  
  const textoMarcaDagua = await ConfiguracaoService.obter('WATERMARK_TEXT', env.WATERMARK_TEXT);
  const posicao = obterPosicaoMarcaDagua(posicaoMarcaDagua || 'BOTTOM_LEFT');

  return new Promise<void>((resolve, reject) => {
    const comando = ffmpeg(arquivoOriginal);
    if (textoMarcaDagua && textoMarcaDagua.trim()) {
      comando.videoFilters({
        filter: 'drawtext',
        options: {
          text: textoMarcaDagua,
          fontcolor: 'white',
          fontsize: 24,
          box: 1,
          boxcolor: 'black@0.5',
          boxborderw: 5,
          x: posicao.x,
          y: posicao.y,
        }
      });
    }

    comando
      .videoCodec('libx264')
      .audioCodec('aac')
      .output(arquivoSaida)
      .on('progress', (progress: { percent?: number }) => {
        if (onProgress && progress.percent) {
          onProgress(Math.min(99, Math.max(0, progress.percent)));
        }
      })
      .on('end', () => {
        if (onProgress) onProgress(100);
        resolve();
      })
      .on('error', reject)
      .run();
  });
}
function obterDuracao(arquivoVideo: string): Promise<number | null> {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(arquivoVideo, (erro: Error | null, metadata: { format?: { duration?: number } }) => {
      if (erro || !metadata?.format?.duration) {
        resolve(null);
        return;
      }
      resolve(metadata.format.duration);
    });
  });
}

function formatarTimestamp(segundos: number): string {
  const hours = Math.floor(segundos / 3600);
  const minutes = Math.floor((segundos % 3600) / 60);
  const secs = Math.floor(segundos % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

async function gerarMiniatura(arquivoVideo: string, diretorioMiniaturas: string, nomeArquivo: string) {
  await garantirDiretorio(path.join(diretorioMiniaturas, 'dummy.txt'));

  const duracao = await obterDuracao(arquivoVideo);
  const timestamp = duracao ? formatarTimestamp(duracao / 2) : '50%';

  return new Promise<string>((resolve, reject) => {
    ffmpeg(arquivoVideo)
      .screenshots({
        timestamps: [timestamp],
        filename: `thumb-${nomeArquivo}.png`,
        folder: diretorioMiniaturas,
      })
      .on('end', () => resolve(`/uploads/thumbnails/thumb-${nomeArquivo}.png`))
      .on('error', reject);
  });
}

export const ProcessamentoService = {
  importarYoutube: async (id: number, url: string, posicaoMarcaDagua?: PosicaoMarcaDagua, qualidade: string = 'maxima') => {
    const diretorio = path.resolve(process.cwd(), env.UPLOAD_DIRECTORY, 'videos');
    const nomeArquivo = `video-${id}-${Date.now()}.mp4`;
    const caminhoTemp = path.join(diretorio, `temp-${nomeArquivo}`);
    const caminhoFinal = path.join(diretorio, nomeArquivo);

    await ProcessamentoRepository.criar({
      videoId: id,
      status: 'EM_ANDAMENTO',
      progresso: 0,
      mensagem: 'Iniciando download do vídeo...',
    });

    await VideoRepository.atualizar(id, { status: 'PROCESSANDO' });

    const posicaoFinal = posicaoMarcaDagua || (await ConfiguracaoService.obter('WATERMARK_POSITION', 'BOTTOM_LEFT')) as PosicaoMarcaDagua;

    try {
      // Download representa 0-50% do processo
      await baixarYoutube(url, caminhoTemp, qualidade, async (percent) => {
        const progressoGlobal = Math.round(percent / 2);
        await ProcessamentoRepository.atualizar(id, {
          progresso: progressoGlobal,
          mensagem: `Baixando vídeo: ${percent.toFixed(1)}%`,
        });
      });

      // Verifica se o arquivo existe e ajusta o caminho caso o youtube-dl tenha mudado a extensão
      let caminhoParaProcessar = caminhoTemp;
      try {
        await fs.access(caminhoParaProcessar);
      } catch (e) {
        const dir = path.dirname(caminhoTemp);
        const base = path.basename(caminhoTemp, '.mp4');
        const files = await fs.readdir(dir);
        const matchingFile = files.find(f => f.startsWith(base) && !f.endsWith('.part'));
        if (matchingFile) {
          caminhoParaProcessar = path.join(dir, matchingFile);
        } else {
          throw new Error(`Arquivo baixado não encontrado. Tentou: ${caminhoTemp}`);
        }
      }

      // Processamento representa 50-100% do processo
      await aplicarMarcaDagua(caminhoParaProcessar, caminhoFinal, posicaoFinal, async (percent) => {
        const progressoGlobal = 50 + Math.round(percent / 2);
        await ProcessamentoRepository.atualizar(id, {
          progresso: Math.min(99, progressoGlobal),
          mensagem: `Aplicando marca d'água: ${percent.toFixed(1)}%`,
        });
      });

      if (caminhoParaProcessar !== caminhoFinal) {
        await fs.rm(caminhoParaProcessar).catch(() => null);
      }

      let miniatura = null;
      try {
        const dirThumbnails = path.resolve(process.cwd(), env.UPLOAD_DIRECTORY, 'thumbnails');
        miniatura = await gerarMiniatura(caminhoFinal, dirThumbnails, `video-${id}-${Date.now()}`);
      } catch (e) {
        console.error('Erro ao gerar miniatura:', e);
      }

      await VideoRepository.atualizar(id, {
        caminhoArquivo: `/uploads/videos/${nomeArquivo}`,
        miniatura: miniatura || undefined,
        tipo: 'INTERNO',
        status: 'ATIVO',
      });

      await ProcessamentoRepository.atualizar(id, {
        status: 'CONCLUIDO',
        progresso: 100,
        mensagem: `Importação concluída com marca d’água aplicada (${posicaoFinal})`,
        finalizadoEm: new Date(),
      });

      return caminhoFinal;
    } catch (erro) {
      console.error('Erro ao importar vídeo do YouTube:', erro);
      await ProcessamentoRepository.atualizar(id, {
        status: 'ERRO',
        mensagem: `Falha na importação do vídeo: ${erro instanceof Error ? erro.message : 'erro desconhecido'}`,
        finalizadoEm: new Date(),
      }).catch(() => null);
      await VideoRepository.atualizar(id, { status: 'ERRO' }).catch(() => null);
      throw erro;
    }
  },

  processarVideoInterno: async (id: number, arquivo: string, posicaoMarcaDagua?: PosicaoMarcaDagua) => {
    const diretorio = path.resolve(process.cwd(), env.UPLOAD_DIRECTORY, 'videos');
    const nomeArquivo = `video-${id}-${Date.now()}.mp4`;
    const caminhoFinal = path.join(diretorio, nomeArquivo);

    await ProcessamentoRepository.criar({
      videoId: id,
      status: 'EM_ANDAMENTO',
      progresso: 0,
      mensagem: 'Iniciando processamento do vídeo...',
    });

    const posicaoFinal = posicaoMarcaDagua || (await ConfiguracaoService.obter('WATERMARK_POSITION', 'BOTTOM_LEFT')) as PosicaoMarcaDagua;

    await aplicarMarcaDagua(arquivo, caminhoFinal, posicaoFinal, async (percent) => {
      await ProcessamentoRepository.atualizar(id, {
        progresso: Math.round(percent),
        mensagem: `Aplicando marca d'água: ${percent.toFixed(1)}%`,
      });
    });

    let miniatura = null;
    try {
      const dirThumbnails = path.resolve(process.cwd(), env.UPLOAD_DIRECTORY, 'thumbnails');
      miniatura = await gerarMiniatura(caminhoFinal, dirThumbnails, `video-${id}-${Date.now()}`);
    } catch (e) {
      console.error('Erro ao gerar miniatura:', e);
    }

    await VideoRepository.atualizar(id, {
      caminhoArquivo: `/uploads/videos/${nomeArquivo}`,
      miniatura: miniatura || undefined,
      status: 'ATIVO',
    });

    await ProcessamentoRepository.atualizar(id, {
      status: 'CONCLUIDO',
      progresso: 100,
      mensagem: `Vídeo interno processado com marca d’água (${posicaoFinal})`,
      finalizadoEm: new Date(),
    });

    return caminhoFinal;
  },
};
