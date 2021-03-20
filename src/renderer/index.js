import React from 'react';
import ReactDOM from 'react-dom';
import Page from './Page.js';

document.addEventListener('DOMContentLoaded', () => {
  const list = MDCList.attachTo(document.querySelector('.mdc-list'));
  list.wrapFocus = true;
});


ReactDOM.render(
  <React.StrictMode>
    <Page></Page>
  </React.StrictMode>,
  document.getElementById('app')
);
