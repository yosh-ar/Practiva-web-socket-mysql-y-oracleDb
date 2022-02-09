
const lblOnline  = document.querySelector('#lblOnline');
const lblOffline = document.querySelector('#lblOffline');


const socket = io();
socket.on('connect', () => {
    lblOffline.style.display = 'none';
    lblOnline.style.display  = '';

});
socket.on('disconnect', () => {
    console.log('Desconectado del servidor');
    lblOnline.style.display  = 'none';
    lblOffline.style.display = '';
});


socket.on('notification', function (data) {
    // console.log(data);
});

