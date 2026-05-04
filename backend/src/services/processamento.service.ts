import path from 'path';
import { createWriteStream } from 'fs';
import fs from 'fs/promises';
import { env } from '../lib/env.js';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ytdl from '@distube/ytdl-core';
import { ProcessamentoRepository } from '../repositories/processamento.repository.js';
import { VideoRepository } from '../repositories/video.repository.js';
import { ConfiguracaoService } from './configuracao.service.js';

ffmpeg.setFfmpegPath(ffmpegPath || 'ffmpeg');
type PosicaoMarcaDagua = 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT' | 'CENTER';

async function garantirDiretorio(destino: string) {
  await fs.mkdir(path.dirname(destino), { recursive: true });
}

async function baixarYoutube(url: string, arquivoDestino: string) {
  await garantirDiretorio(arquivoDestino);
  const info = await ytdl.getInfo(url);
  const formato =
    ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'audioandvideo' }) ||
    ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'audioonly' });

  return new Promise<void>((resolve, reject) => {
    const videoStream = ytdl.downloadFromInfo(info, {
      format: formato,
      highWaterMark: 1 << 25,
      requestOptions: {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        },
      },
    });
    const writeStream = createWriteStream(arquivoDestino);

    videoStream.pipe(writeStream);
    videoStream.on('error', reject);
    writeStream.on('error', reject);
    writeStream.on('finish', resolve);
  });
}

function obterPosicaoMarcaDagua(posicao: PosicaoMarcaDagua) {
  if (posicao === 'TOP_LEFT') return { x: 10, y: 10 };
  if (posicao === 'TOP_RIGHT') return { x: 'w-tw-10', y: 10 };
  if (posicao === 'CENTER') return { x: '(w-tw)/2', y: '(h-th)/2' };
  if (posicao === 'BOTTOM_RIGHT') return { x: 'w-tw-10', y: 'h-th-10' };
  return { x: 10, y: 'h-th-10' };
}

async function aplicarMarcaDagua(arquivoOriginal: string, arquivoSaida: string, posicaoMarcaDagua?: PosicaoMarcaDagua) {
  await garantirDiretorio(arquivoSaida);
  
  const textoMarcaDagua = await ConfiguracaoService.obter('WATERMARK_TEXT', env.WATERMARK_TEXT);
  const posicao = obterPosicaoMarcaDagua(posicaoMarcaDagua || 'BOTTOM_LEFT');

  return new Promise<void>((resolve, reject) => {
    ffmpeg(arquivoOriginal)
      .videoFilters({
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
      })
      .output(arquivoSaida)
      .on('end', () => resolve())
      .on('error', reject)
      .run();
  });
}
async function gerarMiniatura(arquivoVideo: string, diretorioMiniaturas: string, nomeArquivo: string) {
  await garantirDiretorio(path.join(diretorioMiniaturas, 'dummy.txt'));

  return new Promise<string>((resolve, reject) => {
    ffmpeg(arquivoVideo)
      .screenshots({
        timestamps: ['00:00:01.000'],
        filename: `thumb-${nomeArquivo}.png`,
        folder: diretorioMiniaturas,
      })
      .on('end', () => resolve(`/uploads/thumbnails/thumb-${nomeArquivo}.png`))
      .on('error', reject);
  });
}

export const ProcessamentoService = {
  importarYoutube: async (id: number, url: string, posicaoMarcaDagua?: PosicaoMarcaDagua) => {
    const diretorio = path.resolve(process.cwd(), env.UPLOAD_DIRECTORY, 'videos');
    const nomeArquivo = `video-${id}-${Date.now()}.mp4`;
    const caminhoTemp = path.join(diretorio, `temp-${nomeArquivo}`);
    const caminhoFinal = path.join(diretorio, nomeArquivo);

    await ProcessamentoRepository.criar({
      videoId: id,
      status: 'EM_ANDAMENTO',
    });

    const posicaoFinal = posicaoMarcaDagua || (await ConfiguracaoService.obter('WATERMARK_POSITION', 'BOTTOM_LEFT')) as PosicaoMarcaDagua;

    try {
      await baixarYoutube(url, caminhoTemp);
      await aplicarMarcaDagua(caminhoTemp, caminhoFinal, posicaoFinal);
      await fs.rm(caminhoTemp).catch(() => null);

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
    });

    const posicaoFinal = posicaoMarcaDagua || (await ConfiguracaoService.obter('WATERMARK_POSITION', 'BOTTOM_LEFT')) as PosicaoMarcaDagua;

    await aplicarMarcaDagua(arquivo, caminhoFinal, posicaoFinal);

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
      mensagem: `Vídeo interno processado com marca d’água (${posicaoFinal})`,
      finalizadoEm: new Date(),
    });

    return caminhoFinal;
  },
};
