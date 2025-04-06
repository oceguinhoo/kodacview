const cloudName = "dbfwu9sdz";
const uploadPreset = "polaroid";

async function uploadImage() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (!file) return alert("Selecione uma imagem!");

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
    });

    const data = await response.json();
    if (data.secure_url) {
        addImageToGallery(data.secure_url);
    } else {
        alert("Erro ao enviar imagem.");
    }
}

function addImageToGallery(url) {
    const gallery = document.getElementById('gallery');
    const img = document.createElement('img');
    img.src = url;
    gallery.prepend(img);
}
