
// const fs = require('fs');

// const path = require('path');

// const file = path.resolve(__dirname, 'telegram.log');

const now = () => (new Date()).toISOString().substring(0, 19).replace('T', ' ');

const tlog = require('inspc/logt');

// fetchJson('/telegram', {
//     method: 'post',
//     body: {
//         data: 'test send fetch'
//     }
// })

// example message, and more examples: https://core.telegram.org/bots/webhooks#testing-your-bot-with-updates
// {
//     "update_id": 99526886,
//     "message": {
//         "message_id": 42,
//             "from": {
//             "id": 593693414,
//             "is_bot": false,
//             "first_name": "simon",
//             "last_name": "d",
//             "username": "stopsopa",
//             "language_code": "en-GB"
//         },
//         "chat": {
//             "id": 593693414,
//             "first_name": "simon",
//             "last_name": "d",
//             "username": "stopsopa",
//             "type": "private"
//         },
//         "date": 1526332725,
//         "text": "😂"
//     }
// }

module.exports = ({
    io
}) => {

    if ( ! io ) {

        throw new Error(`telegramMiddleware: io is required`);
    }

    let list = [];

    io.on('connection', socket => {

        list.push(socket);

        tlog('auto socket.io connection: ' + list.length);

        socket.on('disconnect', () => {

            list = list.filter(s => s !== socket);

            tlog('auto socket.io disconnect: ' + list.length);
        });

        // tlog('fake emit');
        //
        // socket.emit('s-c-telegram-message', {
        //     "update_id": 9952688,
        //     "message": {
        //         "message_id": 46,
        //         "from": {
        //             "id": 593693414,
        //             "is_bot": false,
        //             "first_name": "simon",
        //             "last_name": "d",
        //             "username": "stopsopa",
        //             "language_code": "en-GB"
        //         },
        //         "chat": {
        //             "id": 593693414,
        //             "first_name": "simon",
        //             "last_name": "d",
        //             "username": "stopsopa",
        //             "type": "private"
        //         },
        //         "date": 1526508326,
        //         "text": "test2 fake"
        //     }
        // });
    });

    return (event, data) => {

        // tlog('incoming message from telegram')

        // const body = req.body;

        list.forEach(socket => {

            socket.emit(event, data);
        });

        // const json = JSON.stringify(req.body, null, 4);

        // fs.appendFileSync(file, json + "\n\n");
        //
        // return res.end(JSON.stringify({ok: true}));
    };
}