const supabase = supabasejs.createClient(
  'https://qewcnffjcrtqwutjymfd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFld2NuZmZqY3J0cXd1dGp5bWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NzI2NzYsImV4cCI6MjA1OTU0ODY3Nn0.XBlNVZ8qmb8ZyMmO9YIWidDJUhdI9b_KBT6YRuVYUq8'
);

let currentUser = null;
let page = 0;

async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  const hash = btoa(password);

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .eq("senha_hash", hash)
    .single();

  if (error || !data) {
    alert("Usuário ou senha inválidos");
  } else {
    currentUser = data;
    document.getElementById("auth").style.display = "none";
    document.getElementById("upload").style.display = "block";
    document.getElementById("welcome").innerText = `Bem-vindo, ${currentUser.username}!`;
    loadGaleria(true);
  }
}

async function register() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  const hash = btoa(password);

  const { error } = await supabase
    .from("profiles")
    .insert([{ id: crypto.randomUUID(), username, senha_hash: hash }]);

  if (error) {
    alert("Erro no cadastro: " + error.message);
  } else {
    alert("Cadastro realizado com sucesso!");
  }
}

function logout() {
  currentUser = null;
  document.getElementById("auth").style.display = "block";
  document.getElementById("upload").style.display = "none";
  document.getElementById("galeria").innerHTML = "";
  page = 0;
}

async function uploadPhoto() {
  const fileInput = document.getElementById("photoInput");
  const descricao = document.getElementById("descricaoInput").value;

  const file = fileInput.files[0];
  if (!file || !currentUser) return;

  const filePath = `${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("fotos")
    .upload(filePath, file);

  if (uploadError) {
    alert("Erro ao fazer upload: " + uploadError.message);
    return;
  }

  const { data: publicUrl } = supabase.storage
    .from("fotos")
    .getPublicUrl(filePath);

  const { error: insertError } = await supabase
    .from("fotos")
    .insert([{ url: publicUrl.publicUrl, descricao, user_id: currentUser.id }]);

  if (insertError) {
    alert("Erro ao salvar imagem: " + insertError.message);
    return;
  }

  alert("Imagem enviada com sucesso!");
  loadGaleria(true);
}

async function loadGaleria(reset = false) {
  if (reset) {
    document.getElementById("galeria").innerHTML = "";
    page = 0;
  }

  const { data, error } = await supabase
    .from("fotos")
    .select("*, profiles(username)")
    .order("id", { ascending: false })
    .range(page * 12, (page + 1) * 12 - 1);

  if (error) {
    console.error("Erro ao carregar galeria:", error.message);
    return;
  }

  const galeria = document.getElementById("galeria");
  data.forEach(foto => {
    const container = document.createElement("div");
    container.className = "foto-container";

    const autor = document.createElement("p");
    autor.innerText = `@${foto.profiles?.username || "Desconhecido"}`;

    const img = document.createElement("img");
    img.src = foto.url;

    const descricao = document.createElement("p");
    descricao.innerText = foto.descricao || "";

    container.appendChild(autor);
    container.appendChild(img);
    container.appendChild(descricao);

    if (currentUser?.id === foto.user_id) {
      const btn = document.createElement("button");
      btn.innerText = "Apagar";
      btn.onclick = () => deletarFoto(foto.id);
      container.appendChild(btn);
    }

    galeria.appendChild(container);
  });

  page++;
}

async function loadMore() {
  loadGaleria();
}

async function deletarFoto(id) {
  if (!confirm("Tem certeza que deseja deletar esta foto?")) return;

  const { error } = await supabase.from("fotos").delete().eq("id", id);
  if (error) {
    alert("Erro ao deletar: " + error.message);
  } else {
    alert("Foto deletada.");
    loadGaleria(true);
  }
}
