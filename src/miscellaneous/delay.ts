export function delay(t: number, val: unknown) {
    return new Promise(function (resolve) {
        setTimeout(()=> {
            resolve(val);
        }, t);
    });
}