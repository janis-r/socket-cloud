const calc = (a: number, b: number) => ((a ** b) + 1) / ((b ** a) + 1);
const analyze = (a: number, b: number) => {
    const result = calc(a, b);
    // console.log(result.toString())
    return {
        a,
        b,
        isOdd: [a % 2 === 0, b % 2 === 0],
        result,
        pass: result === Math.floor(result)
    }
};
// console.log(analyze(4, 97))

const min = 1;
const max = 100;
const data: ReturnType<typeof analyze>[] = [];

for (let a = min; a < max; a++) {
    for (let b = min; b < max; b++) {
        data.push(analyze(a, b));
    }
}

console.log(data.length);
console.log(
    data
        .filter(({pass}) => pass)
        .filter(({a, b, isOdd}) => isOdd[0] !== isOdd[1]))
