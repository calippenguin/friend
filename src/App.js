import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { Plus, Save, UserPlus, ShieldPlus, Trash2, X, LogOut } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [raids, setRaids] = useState([]);
  const [groups, setGroups] = useState([]);

  // 1. 로그인 상태 확인 및 실시간 데이터 로드
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const unsubscribeData = onSnapshot(doc(db, "raidData", "current"), (docSnap) => {
      if (docSnap.exists()) {
        setRaids(docSnap.data().raids || []);
        setGroups(docSnap.data().groups || []);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeData();
    };
  }, []);

  // 2. 로그인/로그아웃 로직
  const handleLogin = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password)
      .catch((error) => alert("로그인 실패: " + error.message));
  };

  const handleLogout = () => signOut(auth);

  // 3. 추가/수정/삭제 로직
  const addRaid = () => {
    if (raids.length >= 30) return alert("최대 30개까지만 가능합니다.");
    const name = prompt("새로운 레이드 이름:");
    if (name) setRaids([...raids, name]);
  };

  const deleteRaid = (index) => {
    if (window.confirm(`'${raids[index]}' 레이드를 삭제하시겠습니까?`)) {
      const newRaids = raids.filter((_, i) => i !== index);
      setRaids(newRaids);
      setGroups(groups.map(g => ({
        ...g,
        characters: g.characters.map(c => ({
          ...c,
          checks: c.checks.filter((_, i) => i !== index)
        }))
      })));
    }
  };

  const addGroup = () => {
    const name = prompt("그룹(사람) 이름:");
    if (name) setGroups([...groups, { id: Date.now(), name, characters: [] }]);
  };

  const deleteGroup = (groupId, name) => {
    if (window.confirm(`'${name}' 그룹을 삭제하시겠습니까?`)) {
      setGroups(groups.filter(g => g.id !== groupId));
    }
  };

  const addCharacter = (groupId) => {
    const charName = prompt("캐릭터 이름:");
    if (charName) {
      setGroups(groups.map(g => g.id === groupId ? {
        ...g,
        characters: [...g.characters, { 
          id: Date.now(), 
          name: charName, 
          checks: new Array(raids.length).fill(false) 
        }]
      } : g));
    }
  };

  const deleteCharacter = (groupId, charId) => {
    setGroups(groups.map(g => g.id === groupId ? {
      ...g,
      characters: g.characters.filter(c => c.id !== charId)
    } : g));
  };

  const toggleCheck = (groupId, charId, raidIdx) => {
    setGroups(groups.map(g => g.id === groupId ? {
      ...g,
      characters: g.characters.map(c => c.id === charId ? {
        ...c,
        checks: c.checks.map((v, i) => i === raidIdx ? !v : v)
      } : c)
    } : g));
  };

  const handleSave = async () => {
    try {
      await setDoc(doc(db, "raidData", "current"), { raids, groups });
      alert("서버에 저장되었습니다!");
    } catch (e) {
      alert("저장 실패: 권한이 없습니다.");
    }
  };

  // 4. UI 렌더링
  if (!user) {
    return (
      <div style={loginContainerStyle}>
        <div style={loginBoxStyle}>
          <h2>레이드 관리자 로그인</h2>
          <form onSubmit={handleLogin} style={formStyle}>
            <input type="email" placeholder="이메일" onChange={e => setEmail(e.target.value)} style={inputStyle} />
            <input type="password" placeholder="비밀번호" onChange={e => setPassword(e.target.value)} style={inputStyle} />
            <button type="submit" style={loginBtnStyle}>로그인</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={headerStyle}>
        <h1>Raid Checklist</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span>{user.email}</span>
          <button onClick={handleLogout} style={logoutBtnStyle}><LogOut size={14} /> 로그아웃</button>
        </div>
      </header>

      <div style={controlBarStyle}>
        <button onClick={addGroup} style={actionBtnStyle}><UserPlus size={18}/> 그룹 추가</button>
        <button onClick={addRaid} style={actionBtnStyle}><Plus size={18}/> 레이드 추가 ({raids.length}/30)</button>
        <button onClick={handleSave} style={saveBtnStyle}><Save size={18}/> 서버에 저장</button>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid #ddd', borderRadius: '8px' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>그룹 / 캐릭터</th>
              {raids.map((r, i) => (
                <th key={i} style={thStyle}>
                  <div style={raidHeaderStyle}>
                    {r}
                    <button onClick={() => deleteRaid(i)} style={delRaidBtnStyle}><X size={12} /></button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map(group => (
              <React.Fragment key={group.id}>
                <tr style={groupRowStyle}>
                  <td colSpan={raids.length + 1} style={groupTdStyle}>
                    <div style={groupTitleStyle}>
                      <span>👤 {group.name}</span>
                      <div>
                        <button onClick={() => addCharacter(group.id)} style={addCharBtnStyle}><ShieldPlus size={14} /> 캐릭추가</button>
                        <button onClick={() => deleteGroup(group.id, group.name)} style={delGroupBtnStyle}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </td>
                </tr>
                {group.characters.map(char => (
                  <tr key={char.id} style={charRowStyle}>
                    <td style={charNameTdStyle}>
                      <div style={charNameStyle}>
                        └ {char.name}
                        <button onClick={() => deleteCharacter(group.id, char.id)} style={delCharBtnStyle}><X size={12} /></button>
                      </div>
                    </td>
                    {raids.map((_, i) => (
                      <td key={i} style={checkTdStyle}>
                        <input 
                          type="checkbox" 
                          checked={char.checks[i] || false} 
                          onChange={() => toggleCheck(group.id, char.id, i)}
                          style={checkboxStyle}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- CSS-in-JS Styles ---
const loginContainerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' };
const loginBoxStyle = { padding: '40px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' };
const inputStyle = { padding: '10px', width: '250px', borderRadius: '4px', border: '1px solid #ddd' };
const loginBtnStyle = { padding: '10px', backgroundColor: '#1877f2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };

const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };
const logoutBtnStyle = { display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' };

const controlBarStyle = { display: 'flex', gap: '10px', marginBottom: '20px' };
const actionBtnStyle = { display: 'flex', alignItems: 'center', gap: '5px', padding: '10px 15px', backgroundColor: '#4a90e2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' };
const saveBtnStyle = { ...actionBtnStyle, backgroundColor: '#2ecc71', marginLeft: 'auto' };

const tableStyle = { width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' };
const thStyle = { backgroundColor: '#34495e', color: 'white', padding: '12px', border: '1px solid #2c3e50', minWidth: '100px' };
const raidHeaderStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' };
const delRaidBtnStyle = { background: 'none', border: '1px solid #e74c3c', color: '#e74c3c', borderRadius: '50%', cursor: 'pointer', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' };

const groupRowStyle = { backgroundColor: '#f9f9f9' };
const groupTdStyle = { padding: '10px 15px', border: '1px solid #ddd' };
const groupTitleStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const addCharBtnStyle = { display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' };
const delGroupBtnStyle = { marginLeft: '8px', padding: '4px', backgroundColor: 'transparent', color: '#e74c3c', border: 'none', cursor: 'pointer' };

const charRowStyle = { borderBottom: '1px solid #eee' };
const charNameTdStyle = { padding: '8px 15px', border: '1px solid #ddd' };
const charNameStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const delCharBtnStyle = { background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' };

const checkTdStyle = { textAlign: 'center', border: '1px solid #ddd' };
const checkboxStyle = { width: '20px', height: '20px', cursor: 'pointer' };

export default App;