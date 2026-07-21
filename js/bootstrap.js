const showBootError = (message) => {
    const container = document.createElement('div');
    container.className = 'boot-error';
    container.textContent = message;
    document.body.appendChild(container);
};

if (window.location.protocol === 'file:') {
    showBootError(
        'This game must be served over HTTP (modules are blocked on file://). ' +
        'Run: python3 -m http.server 8000 (or python) and open http://localhost:8000'
    );
}
