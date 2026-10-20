'use client';
import { useEffect } from 'react';

/** Retain the existing semantic tables and give compact card rows their column labels. */
export function WorkspaceEnhancements() {
  useEffect(()=>{
    const root=document.getElementById('main-content'); if(!root)return;
    const labelTables=()=>root.querySelectorAll('table').forEach(table=>{
      const headers=Array.from(table.querySelectorAll('thead th')).map(th=>th.textContent?.trim() || '');
      if(!headers.length)return;
      table.classList.add('responsive-table');
      table.setAttribute('role','table');
      table.querySelectorAll('tbody tr').forEach(row=>{
        row.setAttribute('role','row');
        Array.from(row.children).forEach((cell,index)=>{cell.setAttribute('role','cell');if(cell.getAttribute('colspan'))return;(cell as HTMLElement).dataset.label=headers[index] || 'Details';});
      });
    });
    labelTables();const observer=new MutationObserver(labelTables);observer.observe(root,{childList:true,subtree:true});return()=>observer.disconnect();
  },[]);
  return <svg className="workspace-art" viewBox="0 0 800 500" fill="none" aria-hidden="true"><g stroke="currentColor" strokeWidth="1"><circle cx="660" cy="140" r="100"/><circle cx="660" cy="140" r="80"/><path d="M40 350h180m-150-40v80m-15-60v40m140-60v80m15-60v40M490 380c-70-100 130-100 60 0zm10-56v-18a18 18 0 0136 0v18"/></g></svg>;
}
