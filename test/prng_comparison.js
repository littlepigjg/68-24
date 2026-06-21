
const OriginalSeededRandom = {
    seededRandom(seed) {
        const x = Math.sin(seed * 9999) * 10000;
        return x - Math.floor(x);
    }
};

const Mulberry32PRNG = {
    _hash32(state) {
        let t = state += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },

    seededRandom(seed) {
        const seedInt = Math.floor(seed) >>> 0;
        return this._hash32(seedInt);
    },

    seededRandom2(seed) {
        let s = Math.floor(seed) >>> 0;
        s = (s + 0x7ed55d16 + (s << 12)) >>> 0;
        s = (s ^ 0xc761c23c ^ (s >>> 19)) >>> 0;
        s = (s + 0x165667b1 + (s << 5)) >>> 0;
        s = (s + 0xd3a2646c ^ (s << 9)) >>> 0;
        s = (s + 0xfd7046c5 + (s << 3)) >>> 0;
        s = (s ^ 0xb55a4f09 ^ (s >>> 16)) >>> 0;
        return (s >>> 0) / 4294967296;
    }
};

const XorshiftPRNG = {
    seededRandom(seed) {
        let x = Math.floor(seed) >>> 0;
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        return (x >>> 0) / 4294967296;
    }
};

function runComparisonTests() {
    console.log('=== 不同 PRNG 算法对比测试 ===\n');

    const testSeeds = [0, 1, 2, 3, 4, 5, 10, 100, 1000, 10000, 12345, 99999, 1000000];
    
    console.log('1. 基础输出对比（前20个 seed）');
    console.log('  seed | 原始(sin) | Mulberry32 | 哈希法 | xorshift');
    console.log('  ----|-----------|------------|--------|---------');
    for (let i = 0; i < 20; i++) {
        const v1 = OriginalSeededRandom.seededRandom(i);
        const v2 = Mulberry32PRNG.seededRandom(i);
        const v3 = Mulberry32PRNG.seededRandom2(i);
        const v4 = XorshiftPRNG.seededRandom(i);
        console.log(`  ${String(i).padStart(4)} | ${v1.toFixed(8)} | ${v2.toFixed(8)} | ${v3.toFixed(8)} | ${v4.toFixed(8)}`);
    }
    console.log('');

    console.log('2. 分布均匀性测试（100万次调用）');
    const buckets = 10;
    const total = 1000000;
    
    const counts1 = new Array(buckets).fill(0);
    const counts2 = new Array(buckets).fill(0);
    const counts3 = new Array(buckets).fill(0);
    const counts4 = new Array(buckets).fill(0);
    
    for (let i = 0; i < total; i++) {
        const v1 = OriginalSeededRandom.seededRandom(i);
        const v2 = Mulberry32PRNG.seededRandom(i);
        const v3 = Mulberry32PRNG.seededRandom2(i);
        const v4 = XorshiftPRNG.seededRandom(i);
        
        counts1[Math.min(Math.floor(v1 * buckets), buckets - 1)]++;
        counts2[Math.min(Math.floor(v2 * buckets), buckets - 1)]++;
        counts3[Math.min(Math.floor(v3 * buckets), buckets - 1)]++;
        counts4[Math.min(Math.floor(v4 * buckets), buckets - 1)]++;
    }
    
    const expected = total / buckets;
    console.log('  区间   | 原始(sin) | Mulberry32 | 哈希法 | xorshift');
    console.log('  -------|-----------|------------|--------|---------');
    for (let i = 0; i < buckets; i++) {
        const d1 = ((counts1[i] - expected) / expected * 100).toFixed(2);
        const d2 = ((counts2[i] - expected) / expected * 100).toFixed(2);
        const d3 = ((counts3[i] - expected) / expected * 100).toFixed(2);
        const d4 = ((counts4[i] - expected) / expected * 100).toFixed(2);
        console.log(`  [${(i/buckets).toFixed(1)},${((i+1)/buckets).toFixed(1)}) | ${d1.padStart(7)}% | ${d2.padStart(7)}% | ${d3.padStart(5)}% | ${d4.padStart(6)}%`);
    }
    console.log('');

    console.log('3. 跨引擎一致性分析');
    console.log('');
    console.log('  原始 sin 基实现：');
    console.log('    - 依赖 Math.sin() 的具体实现');
    console.log('    - ECMAScript 规范未强制规定 sin 的精度');
    console.log('    - 不同引擎可能有 1e-15 ~ 1e-16 量级的差异');
    console.log('    - 乘以 10000 后差异放大到 1e-11 ~ 1e-12');
    console.log('    - 对于像素级渲染（1px 精度），差异通常不可察觉');
    console.log('');
    console.log('  Mulberry32 / 纯整数哈希实现：');
    console.log('    - 完全基于 32 位整数运算');
    console.log('    - 使用 Math.imul 和位移运算');
    console.log('    - ECMAScript 严格规定了这些运算的行为');
    console.log('    - 理论上在所有符合规范的引擎中输出完全一致');
    console.log('    - 不会有浮点数精度累积问题');
    console.log('');

    console.log('4. 性能对比测试（1000万次调用）');
    const perfCount = 10000000;
    
    let start = Date.now();
    for (let i = 0; i < perfCount; i++) {
        OriginalSeededRandom.seededRandom(i);
    }
    const time1 = Date.now() - start;
    
    start = Date.now();
    for (let i = 0; i < perfCount; i++) {
        Mulberry32PRNG.seededRandom(i);
    }
    const time2 = Date.now() - start;
    
    start = Date.now();
    for (let i = 0; i < perfCount; i++) {
        Mulberry32PRNG.seededRandom2(i);
    }
    const time3 = Date.now() - start;
    
    start = Date.now();
    for (let i = 0; i < perfCount; i++) {
        XorshiftPRNG.seededRandom(i);
    }
    const time4 = Date.now() - start;
    
    console.log(`  原始(sin):   ${time1}ms`);
    console.log(`  Mulberry32:  ${time2}ms (${(time1/time2).toFixed(2)}x)`);
    console.log(`  哈希法:      ${time3}ms (${(time1/time3).toFixed(2)}x)`);
    console.log(`  xorshift:    ${time4}ms (${(time1/time4).toFixed(2)}x)`);
    console.log('');

    console.log('5. 大 seed 值行为对比');
    const largeSeeds = [
        1000000,
        1000000000,
        9007199254740992,
        9007199254740993,
    ];
    
    console.log('  seed                | 原始(sin) | Mulberry32 | 哈希法 | xorshift');
    console.log('  --------------------|-----------|------------|--------|---------');
    for (const seed of largeSeeds) {
        const v1 = OriginalSeededRandom.seededRandom(seed);
        const v2 = Mulberry32PRNG.seededRandom(seed);
        const v3 = Mulberry32PRNG.seededRandom2(seed);
        const v4 = XorshiftPRNG.seededRandom(seed);
        const seedStr = seed <= 999999999 ? String(seed) : seed.toExponential(2);
        console.log(`  ${seedStr.padEnd(19)} | ${v1.toFixed(8)} | ${v2.toFixed(8)} | ${v3.toFixed(8)} | ${v4.toFixed(8)}`);
    }
    console.log('');
    
    console.log('  注意：当 seed 超过 2^32 时，32 位 PRNG 会先取模');
    console.log('  而 sin 基实现中，seed * 9999 在 seed 很大时会丢失精度');
    console.log('');

    console.log('6. 对渲染的实际影响估算');
    console.log('  假设 randomOffset = 3px（默认值）');
    console.log('  sin 基实现跨引擎差异 ~ 1e-12 * 2 * 3 = 6e-12 px');
    console.log('  这个差异远小于 1px，人眼完全无法察觉');
    console.log('');
    console.log('  但是，当 seed 值很大时（如超过 2^39），');
    console.log('  seed * 9999 会丢失整数精度，可能导致明显的随机数质量下降');
    console.log('  对于本项目的使用场景（charIndex * 1000 + lineIndex * 10000 + seed）：');
    console.log('    - 一万字文本: seed 约 10^7, 在安全范围内');
    console.log('    - 百万字文本: seed 约 10^9, 在安全范围内');
    console.log('    - 十亿字文本: seed 约 10^12, 接近 2^39 安全边界');
    console.log('');
}

runComparisonTests();
