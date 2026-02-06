const { ipcRenderer } = require('electron');


let images = []


document.getElementById('add-image').addEventListener('click', async () => {
    const filePath = await ipcRenderer.invoke('open-file-dialog');

    if (filePath) {
        images.push(filePath.filePaths[0])
        makeImagesList()

    }
});


document.querySelectorAll('.export-path-select').forEach(item =>{
    item.addEventListener('click',async ()=>{
        const directory = await ipcRenderer.invoke('select-export-folder');

        if(directory){
            document.querySelector('#export-path').value = directory.filePaths[0];
        }
    })
})

function makeImagesList(){
    document.querySelector('.assets-list').innerHTML = '';

    images.forEach(item=>{
        const assest = document.createElement('div');
        assest.classList.add('assest');
        assest.draggable = true;
        assest.dataset.filePath = item;

        const thumb = document.createElement('img');
        thumb.src = item;

        const path = document.createElement('p');
        path.textContent = item;
        path.classList.add('asset-title')

        assest.appendChild(thumb)
        assest.appendChild(path)

        document.querySelector('.assets-list').appendChild(assest)

        assest.addEventListener('dragstart',(e)=>{
            e.dataTransfer.setData('path',assest.dataset.filePath)
        })


    })
}




document.querySelector('#minimize').addEventListener('click', () => {
  ipcRenderer.send('window:minimize');
});

document.querySelector('#maximize').addEventListener('click', () => {
  ipcRenderer.send('window:maximize');
});

document.querySelector('#closeApp').addEventListener('click', () => {
  ipcRenderer.send('window:close');
});

