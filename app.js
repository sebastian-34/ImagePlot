

// DOM elements
const dropZone = document.getElementById('dropZone');
const imageInput = document.getElementById('imageInput');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const progressContainer = document.getElementById('progressContainer');
const spinner = document.getElementById('spinner');
const imgPreview = document.getElementById('imgPreview');
const imgInfo = document.getElementById('imgInfo');
// File input and drag-and-drop logic
dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
});
dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        imageInput.files = e.dataTransfer.files;
        handleFileChange(e.dataTransfer.files[0]);
    }
});

imageInput.addEventListener('change', function(event) {
    if (event.target.files[0]) handleFileChange(event.target.files[0]);
});

function handleFileChange(file) {
    selectedFile = file;
    submitBtn.disabled = !selectedFile;
    resetBtn.style.display = selectedFile ? '' : 'none';
    // Preview
    const reader = new FileReader();
    reader.onload = function(e) {
        imgPreview.src = e.target.result;
        imgPreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
    // Info
    imgInfo.style.display = 'block';
    imgInfo.textContent = `${file.name} (${(file.size/1024).toFixed(1)} KB)`;
}
const downloadPlot = document.getElementById('downloadPlot');
const themeToggle = document.getElementById('themeToggle');
const helpIcon = document.getElementById('helpIcon');
const helpBox = document.getElementById('helpBox');

let selectedFile = null;
let plotDrawn = false;
// Help box
helpIcon.addEventListener('click', () => {
    helpBox.style.display = helpBox.style.display === 'none' ? 'block' : 'none';
});

// Theme toggle
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    themeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
});

// Reset
resetBtn.addEventListener('click', () => {
    selectedFile = null;
    imageInput.value = '';
    imgPreview.style.display = 'none';
    imgInfo.style.display = 'none';
    submitBtn.disabled = true;
    resetBtn.style.display = 'none';
    Plotly.purge('plot');
    downloadPlot.style.display = 'none';
    plotDrawn = false;
});

// Main submit
submitBtn.addEventListener('click', function() {
    if (!selectedFile) return;
    progressContainer.style.display = 'block';
    spinner.style.display = 'block';
    const img = new window.Image();
    const reader = new FileReader();
    reader.onload = function(e) {
        img.src = e.target.result;
    };
    img.onload = function() {
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height).data;
        const r = [], g = [], b = [];
        const totalPixels = img.width * img.height;
        // Sample pixels if too many (e.g. > 30,000)
        const maxPoints = 30000;
        const step = totalPixels > maxPoints ? Math.ceil(totalPixels / maxPoints) : 1;
        let count = 0;
        for (let y = 0; y < img.height; y++) {
            for (let x = 0; x < img.width; x++) {
                if (count % step !== 0) { count++; continue; }
                const idx = (y * img.width + x) * 4;
                r.push(imageData[idx]);
                g.push(imageData[idx + 1]);
                b.push(imageData[idx + 2]);
                count++;
            }
        }
        Plotly.newPlot('plot', [{
            x: r,
            y: g,
            z: b,
            mode: 'markers',
            type: 'scatter3d',
            marker: { size: 2, color: b.map((_,i)=>`rgb(${r[i]},${g[i]},${b[i]})`), opacity: 0.7 }
        }], {
            margin: { l: 0, r: 0, b: 0, t: 0 },
            scene: {
                xaxis: { title: 'Red', range: [0,255] },
                yaxis: { title: 'Green', range: [0,255] },
                zaxis: { title: 'Blue', range: [0,255] }
            },
            title: 'RGB Pixel Distribution'
        }).then(() => {
            progressContainer.style.display = 'none';
            spinner.style.display = 'none';
            downloadPlot.style.display = 'inline-block';
            plotDrawn = true;
        }).catch(() => {
            progressContainer.style.display = 'none';
            spinner.style.display = 'none';
            alert('Failed to plot points. Try a smaller image.');
        });
    };
    reader.readAsDataURL(selectedFile);
});
// ...existing code...

// Download plot
downloadPlot.addEventListener('click', () => {
    if (!plotDrawn) return;
    Plotly.downloadImage('plot', {format: 'png', filename: 'rgb-plot'});
});
