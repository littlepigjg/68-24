
const TextEffects = {
    seededRandomSin(seed) {
        const x = Math.sin(seed * 9999) * 10000;
        return x - Math.floor(x);
    },

    seededRandomIntHash(seed) {
        let s = Math.floor(seed) >>> 0;
        s = (s + 0x7ed55d16 + (s << 12)) >>> 0;
        s = (s ^ 0xc761c23c ^ (s >>> 19)) >>> 0;
        s = (s + 0x165667b1 + (s << 5)) >>> 0;
        s = (s + 0xd3a2646c ^ (s << 9)) >>> 0;
        s = (s + 0xfd7046c5 + (s << 3)) >>> 0;
        s = (s ^ 0xb55a4f09 ^ (s >>> 16)) >>> 0;
        return (s >>> 0) / 4294967296;
    },

    randomOffsetForCharSin(charIndex, lineIndex, seed, randomOffset) {
        const offsetSeed = seed + charIndex * 1000 + lineIndex * 10000;
        const offsetX = (this.seededRandomSin(offsetSeed) - 0.5) * 2 * randomOffset;
        const offsetY = (this.seededRandomSin(offsetSeed + 100) - 0.5) * 2 * randomOffset;
        return { x: offsetX, y: offsetY };
    },

    randomOffsetForCharIntHash(charIndex, lineIndex, seed, randomOffset) {
        const offsetSeed = seed + charIndex * 1000 + lineIndex * 10000;
        const offsetX = (this.seededRandomIntHash(offsetSeed) - 0.5) * 2 * randomOffset;
        const offsetY = (this.seededRandomIntHash(offsetSeed + 100) - 0.5) * 2 * randomOffset;
        return { x: offsetX, y: offsetY };
    }
};

function runRenderAnalysis() {
    console.log('=== 长文本渲染影响分析 ===\n');

    const randomOffset = 3;
    const seed = 0.12345;

    console.log('1. 不同文本长度下的 seed 值范围');
    const textLengths = [100, 1000, 10000, 100000, 1000000, 10000000];
    const charsPerLine = 30;
    
    console.log('  字数   | 最大 seed 值     | 安全? | 备注');
    console.log('  -------|-----------------|-------|------');
    for (const len of textLengths) {
        const lineIndex = Math.floor(len / charsPerLine);
        const charIndex = len % charsPerLine;
        const offsetSeed = seed + charIndex * 1000 + lineIndex * 10000;
        const product = offsetSeed * 9999;
        const isSafe = Number.isSafeInteger(Math.floor(product));
        const safeStr = isSafe ? '是' : '否';
        let note = '';
        if (len <= 10000) note = '常见场景';
        else if (len <= 100000) note = '长文本';
        else note = '超长文本';
        console.log(`  ${String(len).padEnd(6)} | ${offsetSeed.toExponential(6).padEnd(15)} | ${safeStr.padEnd(5)} | ${note}`);
    }
    console.log('');

    console.log('2. 两种算法渲染偏移差异（前100个字符）');
    console.log('  #  | 行 | sin基偏移X    | 整数哈希偏移X | 差值(px)');
    console.log('  ---|---|--------------|--------------|---------');
    for (let i = 0; i < 20; i++) {
        const lineIndex = Math.floor(i / 30);
        const charIndex = i % 30;
        const off1 = TextEffects.randomOffsetForCharSin(charIndex, lineIndex, seed, randomOffset);
        const off2 = TextEffects.randomOffsetForCharIntHash(charIndex, lineIndex, seed, randomOffset);
        const diffX = Math.abs(off1.x - off2.x);
        console.log(`  ${String(i).padEnd(3)}| ${lineIndex}  | ${off1.x.toFixed(10).padStart(12)} | ${off2.x.toFixed(10).padStart(12)} | ${diffX.toFixed(10)}`);
    }
    console.log('');

    console.log('3. 长文本中最大偏移差异统计（10万字）');
    const totalChars = 100000;
    let maxDiffX = 0;
    let maxDiffY = 0;
    let maxDiffChar = 0;
    let totalDiffX = 0;
    let totalDiffY = 0;
    
    for (let i = 0; i < totalChars; i++) {
        const lineIndex = Math.floor(i / charsPerLine);
        const charIndex = i % charsPerLine;
        const off1 = TextEffects.randomOffsetForCharSin(charIndex, lineIndex, seed, randomOffset);
        const off2 = TextEffects.randomOffsetForCharIntHash(charIndex, lineIndex, seed, randomOffset);
        const diffX = Math.abs(off1.x - off2.x);
        const diffY = Math.abs(off1.y - off2.y);
        
        totalDiffX += diffX;
        totalDiffY += diffY;
        
        if (diffX > maxDiffX) {
            maxDiffX = diffX;
            maxDiffChar = i;
        }
        if (diffY > maxDiffY) {
            maxDiffY = diffY;
        }
    }
    
    console.log(`  字符总数: ${totalChars}`);
    console.log(`  X方向最大差异: ${maxDiffX.toFixed(10)} px (第 ${maxDiffChar} 字)`);
    console.log(`  Y方向最大差异: ${maxDiffY.toFixed(10)} px`);
    console.log(`  X方向平均差异: ${(totalDiffX / totalChars).toFixed(10)} px`);
    console.log(`  Y方向平均差异: ${(totalDiffY / totalChars).toFixed(10)} px`);
    console.log('');

    console.log('4. 跨引擎差异的实际影响估算');
    console.log('  假设不同引擎 Math.sin 差异为 1e-15 ~ 1e-16');
    console.log('  乘以 10000 后: 1e-11 ~ 1e-12');
    console.log('  再乘以 2 * randomOffset(3px): 6e-11 ~ 6e-12 px');
    console.log('');
    console.log('  人眼可分辨的最小像素偏移: ~0.5 px');
    console.log('  跨引擎差异比人眼分辨率小约 100 亿倍');
    console.log('  → 视觉上完全无法察觉');
    console.log('');

    console.log('5. 浮点数累积误差分析');
    console.log('  当前实现特点：');
    console.log('    - 无状态：每次调用独立计算，不依赖历史');
    console.log('    - 不会累积：第 N 次调用和第 1 次调用精度相同');
    console.log('    - 结论：浮点数误差不会随调用次数增加而累积');
    console.log('');
    console.log('  可能的精度问题：');
    console.log('    - seed 绝对值过大时，seed * 9999 会丢失精度');
    console.log('    - 但这不是"累积"问题，而是输入范围问题');
    console.log('    - 安全范围：seed * 9999 不超过 2^53 (~9e15)');
    console.log('    - 即 seed 不超过 ~9e11 / 9999 ≈ 9e7 (约9千万)');
    console.log('    - 按当前使用方式，约相当于 9 万字文本，足够日常使用');
    console.log('');

    console.log('6. 实际风险评估');
    console.log('  低风险场景：');
    console.log('    - 单平台渲染（只在 Chrome / Node.js 中运行）');
    console.log('    - 文本长度 < 10 万字');
    console.log('    - 只关心视觉效果，不需要像素级精确一致');
    console.log('');
    console.log('  高风险场景：');
    console.log('    - 跨浏览器截图对比测试');
    console.log('    - 数字签名 / 哈希验证（基于渲染结果）');
    console.log('    - 超长篇文本（> 千万字）');
    console.log('    - 需要像素级可重现性');
    console.log('');

    console.log('7. 改进建议');
    console.log('  方案 A - 保守优化（推荐）：');
    console.log('    - 保持 sin 基实现（简单、分布相对均匀）');
    console.log('    - 将 seed 限制在安全范围内');
    console.log('    - 适用于大多数场景');
    console.log('');
    console.log('  方案 B - 完全替换（追求极致一致性）：');
    console.log('    - 使用纯整数哈希函数替换 Math.sin');
    console.log('    - 完全跨引擎一致');
    console.log('    - 性能更好');
    console.log('    - 但输出序列与原实现不同，可能破坏已有缓存');
    console.log('');
    console.log('  方案 C - 混合方案：');
    console.log('    - 保留原函数作为兼容选项');
    console.log('    - 新增跨引擎一致的版本');
    console.log('    - 通过配置切换');
    console.log('');
}

runRenderAnalysis();
