
const render = document.querySelector('.export');


const showRender = document.querySelector('.showRender');

isShow = false

showRender.addEventListener('click',(e)=>{
    e.stopPropagation();
    isShow = !isShow
    if(isShow){

        render.style.display = 'flex';
    }else{
        render.style.display = 'none';
    }
    
})



render.addEventListener('click',(e)=>{
     e.stopPropagation();
})




document.addEventListener('click',()=>{
    
    render.style.display = 'none';
})

