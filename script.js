const { createClient } = supabase;
const supabaseUrl = 'https://qewcnffjcrtqwutjymfd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFld2NuZmZqY3J0cXd1dGp5bWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NzI2NzYsImV4cCI6MjA1OTU0ODY3Nn0.XBlNVZ8qmb8ZyMmO9YIWidDJUhdI9b_KBT6YRuVYUq8';
const supabase = createClient(supabaseUrl, supabaseKey);

let currentUser = null;
let pagina = 0;

async function login() {
  const username = document.getElementById('username').value.trim();
  const senha = btoa(document.getElementById('senha').value.trim());

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .eq('senha_hash', senha)
    .single();

  if (data) {
    currentUser = data;
    document.getElementById('uploadBox').style.display = 'block';
    document.querySelector('.auth-box').style.display = 'none';
    loadGaleria(true);
  } else {
    alert('Usuário ou senha inválidos');
  }
}

async function cadastro() {
  const username = document.getElementById('username').value.trim();
  const senha = btoa(document.getElementById('senha').value.trim());

  const { data, error } = await supabase
    .from('profiles')
    .insert([{ id: crypto.randomUUID(), username, senha_hash: senha }]);

  if (error) return alert('Erro no cadastro: ' + error.message);
  alert('Cadastro realizado! Agora faça login.');
}

function logout() {
  currentUser = null;
  pagina = 0;
  document.getElementById('uploadBox').style.display = 'none';
  document.querySelector('.auth-box').style.display = 'block';
  document.getElementById('galeria').innerHTML = '';
}

async function uploadFoto() {
  const file = document.getElementById('fileInput').files[0];
  const descricao = document.getElementById('descricaoInput').value.trim();
  if (!file || !currentUser) return;

  const nomeArquivo = Date.now() + '-' + file.name;
  const { error: uploadError } = await supabase.storage
    .from('fotos')
    .upload(nomeArquivo, file);

  if (uploadError) return alert('Erro no upload: ' + uploadError.message);

  const url = `${supabaseUrl}/storage/v1/object/public/fotos/${nomeArquivo}`;
  const { error: insertError } = await supabase
    .from('fotos')
    .insert([{ url, descricao, user_id: currentUser.id }]);

  if (insertError) return alert('Erro ao salvar no banco: ' + insertError.message);

  document.getElementById('fileInput').value = '';
  document.getElementById('descricaoInput').value = '';
  loadGaleria(true);
}

async function loadGaleria(reset = false) {
  if (reset) {
    pagina = 0;
    document.getElementById('galeria').innerHTML = '';
  }

  const { data, error } = await supabase
    .from('fotos')
    .select('*, profiles(username)')
    .order('id', { ascending: false })
    .range(pagina * 6, pagina * 6 + 5);

  if (error) return console.error('Erro ao carregar galeria:', error);

  if (data.length === 0) {
    document.getElementById('carregarMais').style.display = 'none';
    return;
  }

  const galeria = document.getElementById('galeria');
  data.forEach(foto => {
    const div = document.createElement('div');
    div.className = 'polaroid';

    div.innerHTML = `
      <div class="user-label">@${foto.profiles.username}</div>
      <img src="${foto.url}" alt="Foto">
      ${foto.descricao ? `<div class="description">${foto.descricao}</div>` : ''}
      ${currentUser && currentUser.id === foto.user_id
        ? `<button onclick="deletarFoto(${foto.id})">Apagar</button>`
        : ''}
    `;
    galeria.appendChild(div);
  });

  pagina++;
  document.getElementById('carregarMais').style.display = 'block';
}

async function deletarFoto(id) {
  if (!confirm('Deseja apagar essa foto?')) return;
  const { error } = await supabase.from('fotos').delete().eq('id', id);
  if (error) return alert('Erro ao apagar: ' + error.message);
  loadGaleria(true);
}
