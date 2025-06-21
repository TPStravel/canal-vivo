// firestore-structure.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

// ✅ 사용자 정보 저장 함수 (현재 로그인한 사용자 기준)
export async function salvarDadosUsuario(plan) {
  const user = auth.currentUser;
  if (!user) return console.error("❌ Usuário não autenticado");

  try {
    await setDoc(
      doc(db, "temarix_usuarios", user.uid),
      {
        email: user.email || "sem-email",
        plan: plan, // 'journey' ou 'navigator'
        currentPortal: "V2",
        createdAt: new Date().toISOString()
      },
      { merge: true }
    );
    console.log("✅ Dados do usuário salvos com sucesso");
  } catch (error) {
    console.error("❌ Erro ao salvar dados do usuário:", error);
  }
}
const auth = getAuth();

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;

    // ✅ 여기에 추가: 로그인 성공 후 사용자 정보 저장
    const selectedPlan = "journey"; // 또는 "navigator", 실제 플랜 선택 값으로 바꾸세요
    await salvarDadosUsuario(selectedPlan);

    // ✅ 포털로 이동
    window.location.href = "temarix-v2.html"; // 또는 currentPortal 기준으로 설정

  } catch (error) {
    console.error("Erro ao fazer login:", error);
  }
});

// Configuração do Firebase (já foi usada antes, substitua se tiver nova)
const firebaseConfig = {
  apiKey: "AIzaSyDReBGhb2gZNv7KA86HJXTeiLimWTrurp8",
  authDomain: "canal-vivo-chat.firebaseapp.com",
  projectId: "canal-vivo-chat",
  storageBucket: "canal-vivo-chat.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Função principal para salvar resposta
export async function salvarRespostaTemarix({ versao, numeroPergunta, perguntaTexto, respostaTexto }) {
  const user = auth.currentUser;
  if (!user) return console.error("Usuário não autenticado");

  const email = user.email || "sem-email";
  const timestamp = new Date().toISOString();

  try {
    await setDoc(
      doc(db, "temarix_respostas", `${email}_${versao}_${numeroPergunta}`),
      {
        email,
        versao,
        numeroPergunta,
        perguntaTexto,
        respostaTexto,
        timestamp
      }
    );
    console.log("✅ Resposta salva com sucesso");
  } catch (error) {
    console.error("❌ Erro ao salvar resposta:", error);
  }
}
