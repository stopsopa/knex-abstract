/**
 * From: https://github.com/stopsopa/nlab
 */
var promiseall = list => {

    if ( ! Array.isArray(list) ) {

        throw new Error("promiseall: list is not an array");
    }

    let counter = list.length;

    let resolved = true;

    const errors = [];

    return new Promise((resolve, reject) => {

        const ok = i => data => {

            counter -= 1;

            errors[i] = {
                resolved: true,
                data,
            };

            if (counter === 0) {

                resolved ? resolve(list) : reject(errors);
            }
        }

        const wrong = i => data => {

            counter -= 1;

            resolved = false;

            errors[i] = {
                resolved: false,
                data,
            };

            if (counter === 0) {

                reject(errors);
            }
        }

        list.forEach((l, i) => Promise.resolve(l).then(ok(i), wrong(i)));
    });
}

module.exports = promiseall;

