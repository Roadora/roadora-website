export const $=(selector,root=document)=>root.querySelector(selector);
export const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
export function setText(selector,value){const el=$(selector);if(el)el.textContent=value;}
export function showToast(message){const toast=$('#toast');if(!toast)return;toast.textContent=message;toast.classList.add('show');window.setTimeout(()=>toast.classList.remove('show'),2600);}
