// Debug script to check current session in browser
console.log(`
🔍 セッションデバッグ手順:

1. ブラウザのコンソール（F12）で以下を実行：

fetch('/api/auth/session')
  .then(r => r.json())
  .then(data => {
    console.log('Current Session:', data);
    console.log('User ID:', data?.user?.id);
    console.log('User Role:', data?.user?.role);
    console.log('User Email:', data?.user?.email);
  });

2. 出力されたroleを確認してください
   - role: "senior" なら → クッキーの問題
   - role: "learner" なら → セッションが更新されていない
   - null/undefined なら → ログインしていない

3. 結果を教えてください
`);
