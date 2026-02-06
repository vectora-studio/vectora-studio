const tools = document.querySelectorAll('.tool');

let current_tool = 'select';

document.getElementById(current_tool)?.classList.add('active');

tools.forEach(tool => {
  tool.addEventListener('click', () => {

    tools.forEach(t => t.classList.remove('active'));

    current_tool = tool.id;
    tool.classList.add('active');

    
    document.dispatchEvent(new CustomEvent('toolChange', {
      detail: { tool: current_tool }
    }));
    document.dispatchEvent(event);
  });
});
