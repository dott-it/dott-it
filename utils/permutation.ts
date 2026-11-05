
export function generatePermutations(input:string[]):string[][]{
    if(input.length===1)return [input];
    const permutations:string[][]=[];
    for(let i= 0; i<input.length; i++){
        const item=input[i];
        if(item==null) continue;
        const rest = [...input];
        rest.splice(i,1);
        const innerPermutations = generatePermutations(rest);
        for(const permutation of innerPermutations){
            permutations.push([item,...permutation])
        }
    }
    return permutations
}

export function generateRemoveCombinations(input:string[]):string[][]{
    if(input.length ===1) return [input];
    const combinations:string[][]=[]
    for (let i=0; i<input.length; i++){
        const item = input[i];
        if(item==null) continue;
        const rest = input.slice(i+1);
        const innercombinations= generateRemoveCombinations(rest);
        for(const combination of innercombinations){
            combinations.push([item,...combination])
        }
        combinations.push([item])
    }
    return combinations;
}

export function generatePermutationsWithRemoveCombinations(input:string[],separator:string):string[]{
    const permutations= generatePermutations(input);
    const permComb= new Set<string>();
    for(const permutation of permutations){
        const combinations = generateRemoveCombinations(permutation);
        for (const combination of combinations){
            permComb.add(combination.join(separator));
        }
    }
    return [...permComb].sort((a,b)=>b.length-a.length)
}