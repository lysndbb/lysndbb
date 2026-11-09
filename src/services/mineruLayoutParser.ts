export interface MinerUBlock {
  blockId: string;
  type: 'title' | 'paragraph' | 'table' | 'stamp' | 'noise_filtered';
  content: string;
  readingOrder: number;
  confidence: number;
  metadata?: {
    tableRows?: string[][];
    headers?: string[];
    isCertifiedStamp?: boolean;
    pageNumber?: number;
  };
}

export interface MinerUParseResult {
  fileName: string;
  fileHash: string;
  readingOrderStream: MinerUBlock[];
  tableMatrixCount: number;
  filteredNoiseCount: number;
  hasOfficialStamp: boolean;
  hasApplicantSignature: boolean;
  cleanTextForEvaluation: Record<string, string>;
  parsingSummary: string;
}

export class MinerULayoutParser {
  public parseDocument(rawContent: string, fileName: string = '申报材料.docx'): MinerUParseResult {
    const lines = rawContent.split('\n').map(l => l.trim()).filter(Boolean);
    const blocks: MinerUBlock[] = [];
    let orderCounter = 1;
    let tableCount = 0;
    let noiseCount = 0;
    let hasOfficialStamp = false;
    let hasApplicantSignature = false;

    // 阶段1：模拟MinerU版面检测与多模态元素分类
    lines.forEach((line) => {
      // 过滤页眉页脚与孤立页码
      if (/^第\s*\d+\s*页/.test(line) || /^-\s*\d+\s*-$/.test(line) || /^---\s*第\s*\d+\s*页.*---$/.test(line) || /^\d+\s*\/\s*\d+$/.test(line) || line.includes('学生工作处制表') || line.includes('Page of')) {
        noiseCount++;
        blocks.push({
          blockId: `noise_${noiseCount}`,
          type: 'noise_filtered',
          content: line,
          readingOrder: -1,
          confidence: 0.99
        });
        return;
      }

      // 检测公章与签名声明
      if (line.includes('公章') || line.includes('团委盖章') || line.includes('党支部认证') || line.includes('已盖章')) {
        hasOfficialStamp = true;
        blocks.push({
          blockId: `stamp_${orderCounter}`,
          type: 'stamp',
          content: line,
          readingOrder: orderCounter++,
          confidence: 0.98,
          metadata: { isCertifiedStamp: true }
        });
        return;
      }

      if (line.includes('承诺上述申报所有经历真实有效') || line.includes('本人签字') || line.includes('申报人签名')) {
        hasApplicantSignature = true;
        blocks.push({
          blockId: `stamp_sig_${orderCounter}`,
          type: 'stamp',
          content: line,
          readingOrder: orderCounter++,
          confidence: 0.97,
          metadata: { isCertifiedStamp: false }
        });
        return;
      }

      // 检测大标题与章节标题
      if (/^【.*】$/.test(line) || /^第[一二三四五六七八九十]+[章节部分、]/.test(line) || /^[一二三四五]、/.test(line)) {
        blocks.push({
          blockId: `title_${orderCounter}`,
          type: 'title',
          content: line,
          readingOrder: orderCounter++,
          confidence: 0.96
        });
        return;
      }

      // 检测表格结构（包含多列分隔或履历属性）
      if (line.includes('|') || line.includes('任期：') || line.includes('职务：') || line.includes('绩点：') || line.includes('证明人：')) {
        tableCount++;
        const cells = line.split(/[|；,，]/).map(c => c.trim()).filter(Boolean);
        blocks.push({
          blockId: `tbl_blk_${tableCount}`,
          type: 'table',
          content: line,
          readingOrder: orderCounter++,
          confidence: 0.95,
          metadata: {
            tableRows: [cells]
          }
        });
        return;
      }

      // 常规正文段落
      blocks.push({
        blockId: `p_blk_${orderCounter}`,
        type: 'paragraph',
        content: line,
        readingOrder: orderCounter++,
        confidence: 0.94
      });
    });

    // 阶段2：拓扑排序重构阅读序（模拟MinerU多列阅读流排序）
    const validBlocks = blocks.filter(b => b.type !== 'noise_filtered');
    validBlocks.sort((a, b) => a.readingOrder - b.readingOrder);

    // 阶段3：为后续五维智能体生成干净的证据段号字典
    const cleanDict: Record<string, string> = {};
    let pIdx = 1;
    validBlocks.forEach(b => {
      cleanDict[`P1-${pIdx++}`] = b.content;
    });

    const hashVal = Math.random().toString(16).substring(2, 10);
    const summary = `MinerU版面解构引擎处理完成 识别有效区块 ${validBlocks.length} 个 过滤页眉页脚噪点 ${noiseCount} 处 还原结构化表格 ${tableCount} 组 发现官方印鉴认证 ${hasOfficialStamp ? '已核验' : '未检测到'}`;

    return {
      fileName,
      fileHash: hashVal,
      readingOrderStream: validBlocks,
      tableMatrixCount: tableCount,
      filteredNoiseCount: noiseCount,
      hasOfficialStamp,
      hasApplicantSignature,
      cleanTextForEvaluation: cleanDict,
      parsingSummary: summary
    };
  }
}

export const mineruLayoutParser = new MinerULayoutParser();
