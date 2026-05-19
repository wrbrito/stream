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

  let formatString = qualidade;
  if (qualidade === '1080p') formatString = 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best';
  else if (qualidade === '720p') formatString = 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best';
  else if (qualidade === '480p') formatString = 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]/best';
  else if (qualidade === '360p') formatString = 'bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/best[height<=360][ext=mp4]/best';
  else if (qualidade === 'maxima') formatString = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';

  try {
    const subprocess = youtubedl.exec(url, {
      output: arquivoDestino,
      format: formatString,
      mergeOutputFormat: 'mp4',
      ffmpegLocation: ffmpegPath || undefined,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'],
      newline: true,
    });

    if (onProgress && subprocess.stdout) {
      subprocess.stdout.on('data', (data) => {
        const output = data.toString();
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

async function analisarMidia(arquivo: string): Promise<{ temVideo: boolean; temAudio: boolean; duracao: number | null; isAudioOnly: boolean }> {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(arquivo, (err: any, metadata: any) => {
      if (err || !metadata) {
        resolve({ temVideo: false, temAudio: false, duracao: null, isAudioOnly: false });
        return;
      }
      // Consideramos apenas vídeos reais (não capas de áudio)
      // Capas de MP3 geralmente são mjpeg e não têm framerate normal
      const videoStream = metadata.streams.find((s: any) => s.codec_type === 'video');
      const audioStream = metadata.streams.find((s: any) => s.codec_type === 'audio');
      
      const temVideoReal = videoStream && videoStream.codec_name !== 'mjpeg';
      const temAudio = !!audioStream;
      const duracao = metadata.format.duration ?? null;
      
      resolve({ 
          temVideo: !!videoStream, 
          temAudio, 
          duracao,
          isAudioOnly: !temVideoReal && temAudio
      });
    });
  });
}

async function aplicarMarcaDagua(arquivoOriginal: string, arquivoSaida: string, posicaoMarcaDagua?: PosicaoMarcaDagua, onProgress?: (percentual: number) => void) {
  await garantirDiretorio(arquivoSaida);
  
  const midia = await analisarMidia(arquivoOriginal);
  const textoMarcaDagua = await ConfiguracaoService.obter('WATERMARK_TEXT', env.WATERMARK_TEXT);
  const posicao = obterPosicaoMarcaDagua(posicaoMarcaDagua || 'BOTTOM_LEFT');

  return new Promise<void>((resolve, reject) => {
    const comando = ffmpeg(arquivoOriginal);
    
    if (midia.isAudioOnly) {
        // Se for apenas áudio (ou MP3 com capa mjpeg), ignoramos o vídeo/capa 
        // para evitar erros de muxing e framerate no MP4.
        comando.noVideo().audioCodec('aac').audioBitrate('128k');
    } else {
        // Processamento normal de vídeo
        if (midia.temVideo && textoMarcaDagua && textoMarcaDagua.trim()) {
            const isWindows = process.platform === 'win32';
            const fontPath = isWindows ? 'C\\:/Windows/Fonts/arial.ttf' : undefined;

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
                    ...(fontPath ? { fontfile: fontPath } : {})
                }
            });
        }

        comando
            .videoCodec('libx264')
            .outputOptions(['-pix_fmt yuv420p', '-preset fast', '-crf 23'])
            .audioCodec('aac')
            .audioBitrate('128k');
    }

    comando
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
      .on('error', (err: Error, stdout: string, stderr: string) => {
        console.error('Erro FFmpeg aplicarMarcaDagua:', err.message);
        if (stderr) console.error('FFmpeg stderr:', stderr);
        reject(new Error(`Falha no processamento: ${err.message}`));
      })
      .run();
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
  const midia = await analisarMidia(arquivoVideo);
  
  if (midia.isAudioOnly) return null;

  const timestamp = midia.duracao ? formatarTimestamp(midia.duracao / 2) : '50%';

  return new Promise<string>((resolve, reject) => {
    ffmpeg(arquivoVideo)
      .screenshots({
        timestamps: [timestamp],
        filename: `thumb-${nomeArquivo}.png`,
        folder: diretorioMiniaturas,
      })
      .on('end', () => resolve(`/uploads/thumbnails/thumb-${nomeArquivo}.png`))
      .on('error', (err: Error) => {
          console.warn('Erro ao gerar miniatura:', err.message);
          resolve('');
      });
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
      await baixarYoutube(url, caminhoTemp, qualidade, async (percent) => {
        const progressoGlobal = Math.round(percent / 2);
        await ProcessamentoRepository.atualizar(id, {
          progresso: progressoGlobal,
          mensagem: `Baixando vídeo: ${percent.toFixed(1)}%`,
        });
      });

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
          throw new Error(`Arquivo baixado não encontrado.`);
        }
      }

      await aplicarMarcaDagua(caminhoParaProcessar, caminhoFinal, posicaoFinal, async (percent) => {
        const progressoGlobal = 50 + Math.round(percent / 2);
        await ProcessamentoRepository.atualizar(id, {
          progresso: Math.min(99, progressoGlobal),
          mensagem: `Processando mídia: ${percent.toFixed(1)}%`,
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
        mensagem: `Importação concluída`,
        finalizadoEm: new Date(),
      });

      return caminhoFinal;
    } catch (erro) {
      console.error('Erro ao importar vídeo do YouTube:', erro);
      await ProcessamentoRepository.atualizar(id, {
        status: 'ERRO',
        mensagem: `Falha na importação: ${erro instanceof Error ? erro.message : 'erro desconhecido'}`,
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
      mensagem: 'Iniciando processamento...',
    });

    const posicaoFinal = posicaoMarcaDagua || (await ConfiguracaoService.obter('WATERMARK_POSITION', 'BOTTOM_LEFT')) as PosicaoMarcaDagua;

    try {
        await aplicarMarcaDagua(arquivo, caminhoFinal, posicaoFinal, async (percent) => {
            await ProcessamentoRepository.atualizar(id, {
                progresso: Math.round(percent),
                mensagem: `Processando mídia: ${percent.toFixed(1)}%`,
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
            mensagem: `Processamento concluído`,
            finalizadoEm: new Date(),
        });

        return caminhoFinal;
    } catch (erro) {
        console.error('Erro ao processar vídeo interno:', erro);
        await ProcessamentoRepository.atualizar(id, {
            status: 'ERRO',
            mensagem: `Falha no processamento: ${erro instanceof Error ? erro.message : 'erro desconhecido'}`,
            finalizadoEm: new Date(),
        }).catch(() => null);
        await VideoRepository.atualizar(id, { status: 'ERRO' }).catch(() => null);
        throw erro;
    }
  },
};
