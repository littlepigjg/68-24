const seededRandom = function(seed) {
    const x = Math.sin(seed * 9999) * 10000;
    return x - Math.floor(x);
};

function runTests() {
    console.log('=== seededRandom 函数分析测试 ===\n');

    console.log('1. 基础输出测试（前20个值）');
    for (let i = 0; i < 20; i++) {
        const val = seededRandom(i);
        console.log(`  seed=${i}: ${val.toFixed(15)}`);
    }
    console.log('');

    console.log('2. 大种子值测试（验证浮点数精度）');
    const largeSeeds = [1000, 10000, 100000, 1000000, 10000000, 100000000, 1000000000];
    for (const seed of largeSeeds) {
        const val = seededRandom(seed);
        console.log(`  seed=${seed}: ${val.toFixed(15)}`);
    }
    console.log('');

    console.log('3. 递增种子的连续性测试');
    let prev = null;
    let maxDiff = 0;
    let minDiff = 1;
    for (let i = 0; i < 10000; i++) {
        const val = seededRandom(i);
        if (prev !== null) {
            const diff = Math.abs(val - prev);
            if (diff > maxDiff) maxDiff = diff;
            if (diff < minDiff) minDiff = diff;
        }
        prev = val;
    }
    console.log(`  最大相邻差值: ${maxDiff.toFixed(10)}`);
    console.log(`  最小相邻差值: ${minDiff.toFixed(10)}`);
    console.log('');

    console.log('4. 分布均匀性测试（100万次调用）');
    const buckets = 10;
    const counts = new Array(buckets).fill(0);
    const total = 1000000;
    for (let i = 0; i < total; i++) {
        const val = seededRandom(i);
        const bucket = Math.min(Math.floor(val * buckets), buckets - 1);
        counts[bucket]++;
    }
    const expected = total / buckets;
    console.log(`  期望每个区间: ${expected}`);
    for (let i = 0; i < buckets; i++) {
        const deviation = ((counts[i] - expected) / expected * 100).toFixed(2);
        console.log(`  区间 [${(i/buckets).toFixed(1)}, ${((i+1)/buckets).toFixed(1)}): ${counts[i]} (偏差: ${deviation}%)`);
    }
    console.log('');

    console.log('5. 浮点精度累积测试');
    console.log('  注意：此函数是无状态的，每次调用独立计算，不会累积误差');
    console.log('  但 seed * 9999 可能在 seed 很大时丢失精度');
    console.log('');
    
    console.log('  测试大 seed 值的精度丢失：');
    const precisionTestSeeds = [
        0.1, 0.01, 0.001, 0.0001,
        123456789012345, 1234567890123456, 12345678901234567
    ];
    for (const seed of precisionTestSeeds) {
        const multiplied = seed * 9999;
        const sinResult = Math.sin(multiplied);
        console.log(`  seed=${seed}`);
        console.log(`    seed * 9999 = ${multiplied}`);
        console.log(`    sin(seed*9999) = ${sinResult.toFixed(15)}`);
        console.log(`    结果: ${seededRandom(seed).toFixed(15)}`);
    }
    console.log('');

    console.log('6. 整数 seed 的安全范围测试');
    console.log('  IEEE 754 双精度浮点数的精确整数范围是 -2^53 到 2^53');
    console.log(`  2^53 = ${Math.pow(2, 53)}`);
    console.log('');
    
    let maxSafeSeedForInt = 0;
    for (let power = 0; power <= 53; power++) {
        const seed = Math.pow(2, power);
        const product = seed * 9999;
        if (Number.isSafeInteger(product)) {
            maxSafeSeedForInt = seed;
        }
    }
    console.log(`  保证 seed * 9999 为精确整数的最大 seed: ${maxSafeSeedForInt}`);
    console.log(`  约为 2^${Math.floor(Math.log2(maxSafeSeedForInt))}`);
    console.log('');

    console.log('7. 模拟渲染场景 - 单字符多次调用');
    const charIndex = 1000;
    const lineIndex = 50;
    const seed = 0.12345;
    const randomOffset = 3;
    
    const offsetSeed = seed + charIndex * 1000 + lineIndex * 10000;
    const offsetX = (seededRandom(offsetSeed) - 0.5) * 2 * randomOffset;
    const offsetY = (seededRandom(offsetSeed + 100) - 0.5) * 2 * randomOffset;
    
    console.log(`  offsetSeed = ${offsetSeed}`);
    console.log(`  offsetX = ${offsetX.toFixed(10)}`);
    console.log(`  offsetY = ${offsetY.toFixed(10)}`);
    console.log('');

    console.log('8. 极端场景 - 大 seed 值下的渲染偏移');
    const extremeSeed = 1000000;
    const extremeCharIndex = 99999;
    const extremeLineIndex = 999;
    
    const extremeOffsetSeed = extremeSeed + extremeCharIndex * 1000 + extremeLineIndex * 10000;
    const extremeOffsetX = (seededRandom(extremeOffsetSeed) - 0.5) * 2 * randomOffset;
    const extremeOffsetY = (seededRandom(extremeOffsetSeed + 100) - 0.5) * 2 * randomOffset;
    
    console.log(`  seed = ${extremeSeed}`);
    console.log(`  charIndex = ${extremeCharIndex}`);
    console.log(`  lineIndex = ${extremeLineIndex}`);
    console.log(`  offsetSeed = ${extremeOffsetSeed}`);
    console.log(`  offsetSeed * 9999 = ${extremeOffsetSeed * 9999}`);
    console.log(`  offsetX = ${extremeOffsetX.toFixed(10)}`);
    console.log(`  offsetY = ${extremeOffsetY.toFixed(10)}`);
    console.log('');

    console.log('9. 可重复性验证');
    const testSeed = 42;
    const result1 = [];
    const result2 = [];
    for (let i = 0; i < 100; i++) {
        result1.push(seededRandom(testSeed + i));
    }
    for (let i = 0; i < 100; i++) {
        result2.push(seededRandom(testSeed + i));
    }
    let allSame = true;
    for (let i = 0; i < 100; i++) {
        if (result1[i] !== result2[i]) {
            allSame = false;
            break;
        }
    }
    console.log(`  相同 seed 序列是否完全一致: ${allSame}`);
    console.log(`  第 0 个值: ${result1[0].toFixed(15)}`);
    console.log(`  第 50 个值: ${result1[50].toFixed(15)}`);
    console.log(`  第 99 个值: ${result1[99].toFixed(15)}`);
    console.log('');

    console.log('10. 跨引擎一致性理论分析');
    console.log('  Math.sin() 规范：ECMAScript 未强制规定具体精度实现');
    console.log('  不同引擎可能使用不同的数学库：');
    console.log('    - V8 (Chrome/Node.js): 自有实现');
    console.log('    - SpiderMonkey (Firefox): 可能使用系统库或 fdlibm');
    console.log('    - JavaScriptCore (Safari): 自有实现');
    console.log('  差异通常在最后 1-2 位有效数字（约 1e-15 量级）');
    console.log('  乘以 10000 后，差异可能放大到 1e-11 量级');
    console.log('  对于像素级渲染（通常 1px 精度），这种差异可以忽略');
    console.log('');

    console.log('=== 总结 ===');
    console.log('1. 此函数是无状态的，不会累积浮点误差');
    console.log('2. 但 seed * 9999 在 seed 很大时可能丢失精度');
    console.log('3. Math.sin 在不同引擎间可能有微小差异（约 1e-15 量级）');
    console.log('4. 对于像素级渲染，这些差异通常不可察觉');
    console.log('5. 如需严格跨引擎一致性，建议使用纯整数运算的 PRNG（如 Mulberry32, xorshift 等）');
}

runTests();
