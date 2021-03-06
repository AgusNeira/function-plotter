Array.prototype.findAll = function(condition) {
    let idxs = [];
    for (let i = 0; i < this.length; i++) {
        if (condition(this[i])) idxs.push(i);
    }
    return idxs;
}

function equationParser(equationText) {
    console.log(equationText);
    let termSeparators = equationText.split().findAll(ch => ch === '+' || ch === '-');
    console.log(termSeparators);
}
