import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc, query, where, onSnapshot, serverTimestamp, deleteField } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const now = () => serverTimestamp();
const uid = () => auth.currentUser?.uid || null;
const clean = (value) => value === undefined ? null : value;
const normalize = (value) => value && typeof value.toDate === 'function' ? value.toDate().toISOString() : value;
const toData = (snap) => { const raw = snap.data(); return { id: snap.id, ...Object.fromEntries(Object.entries(raw).map(([k,v]) => [k, normalize(v)])) }; };
const mapError = (error) => ({ message: error?.message || 'Firebase operation failed', code: error?.code || 'unknown' });

class QueryBuilder {
  constructor(table) { this.table = table; this.filters = []; this.sort = null; this.limitCount = null; this.mode = 'select'; this.payload = null; this.singleMode = false; }
  select() { if (this.mode === 'select') this.mode = 'select'; return this; }
  eq(field, value) { this.filters.push({ op: 'eq', field, value }); return this; }
  is(field, value) { this.filters.push({ op: 'is', field, value }); return this; }
  gte(field, value) { this.filters.push({ op: 'gte', field, value }); return this; }
  lte(field, value) { this.filters.push({ op: 'lte', field, value }); return this; }
  order(field, options = {}) { this.sort = { field, ascending: options.ascending !== false }; return this; }
  limit(value) { this.limitCount = value; return this; }
  single() { this.singleMode = true; return this; }
  maybeSingle() { this.singleMode = 'maybe'; return this; }
  insert(payload) { this.mode = 'insert'; this.payload = Array.isArray(payload) ? payload : [payload]; return this; }
  update(payload) { this.mode = 'update'; this.payload = payload; return this; }
  async execute() {
    try {
      const ref = collection(db, this.table);
      if (this.mode === 'insert') {
        for (const item of this.payload) await addDoc(ref, { ...item, created_at: now(), updated_at: now() });
        return { data: this.payload, error: null };
      }
      const firestoreFilters = this.filters.filter(f => f.op === 'eq' || f.op === 'is' || f.op === 'gte' || f.op === 'lte').map(f => where(f.field, f.op === 'eq' || f.op === 'is' ? '==' : f.op, f.value));
      const snaps = await getDocs(query(ref, ...firestoreFilters));
      let rows = snaps.docs.map(toData).filter(row => this.filters.every(f => {
        if (f.op === 'eq') return row[f.field] === f.value;
        if (f.op === 'is') return f.value === null ? row[f.field] == null : row[f.field] === f.value;
        if (f.op === 'gte') return String(row[f.field] || '') >= String(f.value);
        if (f.op === 'lte') return String(row[f.field] || '') <= String(f.value);
        return true;
      }));
      if (this.sort) rows.sort((a,b) => { const av = String(a[this.sort.field] || ''), bv = String(b[this.sort.field] || ''); return (av.localeCompare(bv)) * (this.sort.ascending ? 1 : -1); });
      if (this.table === 'organization_members') rows = await Promise.all(rows.map(async row => { const org = await getDoc(doc(db, 'organizations', row.organization_id)); const profile = await getDoc(doc(db, 'profiles', row.user_id)); return { ...row, organizations: org.exists() ? toData(org) : null, profiles: profile.exists() ? toData(profile) : null }; }));
      if (this.limitCount) rows = rows.slice(0, this.limitCount);
      if (this.mode === 'update') {
        for (const row of rows) await updateDoc(doc(db, this.table, row.id), { ...this.payload, updated_at: now() });
        return { data: rows, error: null };
      }
      if (this.singleMode === true) return { data: rows[0] || null, error: rows[0] ? null : { message: 'No rows found' } };
      if (this.singleMode === 'maybe') return { data: rows[0] || null, error: null };
      return { data: rows, error: null };
    } catch (error) { return { data: null, error: mapError(error) }; }
  }
  then(resolve, reject) { return this.execute().then(resolve, reject); }
}

async function createOrganization(args) {
  const user = auth.currentUser; if (!user) return { data: null, error: { message: 'not_authenticated' } };
  const orgRef = await addDoc(collection(db, 'organizations'), { name: args.p_name.trim(), sector: args.p_sector.trim(), currency: args.p_currency, address: args.p_address || null, created_by: user.uid, created_at: now(), updated_at: now() });
  await setDoc(doc(db, 'organization_members', `${orgRef.id}_${user.uid}`), { id: `${orgRef.id}_${user.uid}`, organization_id: orgRef.id, user_id: user.uid, role: 'admin', active: true, created_at: now(), updated_at: now() });
  await setDoc(doc(db, 'profiles', user.uid), { id: user.uid, email: user.email || '', full_name: user.displayName || user.email?.split('@')[0] || '', active: true, organization_id: orgRef.id, created_at: now(), updated_at: now() }, { merge: true });
  return { data: orgRef.id, error: null };
}
async function closeDay(args) {
  const user = auth.currentUser; if (!user) return { data: null, error: { message: 'not_authenticated' } };
  const offers = await table('offerings').select('*').eq('organization_id', args.p_org).eq('business_date', args.p_date).is('deleted_at', null); const tithes = await table('tithes').select('*').eq('organization_id', args.p_org).eq('delivery_date', args.p_date).is('deleted_at', null);
  const totalOffers = (offers.data || []).reduce((s,r) => s + Number(r.amount_cents || 0), 0), totalTithes = (tithes.data || []).reduce((s,r) => s + Number(r.amount_cents || 0), 0);
  const id = args.p_date; await setDoc(doc(db, 'daily_closures', `${args.p_org}_${id}`), { id: `${args.p_org}_${id}`, organization_id: args.p_org, business_date: id, offerings_total_cents: totalOffers, tithes_total_cents: totalTithes, total_cents: totalOffers + totalTithes, records_count: (offers.data || []).length + (tithes.data || []).length, status: 'closed', closed_by: user.uid, closed_at: now(), notes: args.p_notes || null }, { merge: true });
  return { data: `${args.p_org}_${id}`, error: null };
}
async function reopenDay(args) { const user = auth.currentUser; if (!user) return { data: null, error: { message: 'not_authenticated' } }; await updateDoc(doc(db, 'daily_closures', `${args.p_org}_${args.p_date}`), { status: 'open', reopened_by: user.uid, reopened_at: now(), reopen_reason: args.p_reason }); return { data: true, error: null }; }
async function adminAddMember(args) { const user = auth.currentUser; if (!user) return { data: null, error: { message: 'not_authenticated' } }; const profiles = await table('profiles').select('*').eq('email', args.p_email.toLowerCase()).maybeSingle(); if (!profiles.data) return { data: null, error: { message: 'not_found' } }; const id = `${args.p_org}_${profiles.data.id}`; await setDoc(doc(db, 'organization_members', id), { id, organization_id: args.p_org, user_id: profiles.data.id, role: args.p_role, active: true, invited_by: user.uid, updated_at: now() }, { merge: true }); return { data: id, error: null }; }
function table(name) { return new QueryBuilder(name); }

export function createFirebaseClient() {
  return {
    from: table,
    auth: {
      async signUp({ email, password, options }) { try { const cred = await createUserWithEmailAndPassword(auth, email, password); if (options?.data?.full_name) await updateProfile(cred.user, { displayName: options.data.full_name }); await setDoc(doc(db, 'profiles', cred.user.uid), { id: cred.user.uid, email, full_name: options?.data?.full_name || '', active: true, created_at: now(), updated_at: now() }, { merge: true }); return { data: { user: cred.user, session: { user: cred.user } }, error: null }; } catch (e) { return { data: null, error: mapError(e) }; } },
      async signInWithPassword({ email, password }) { try { const cred = await signInWithEmailAndPassword(auth, email, password); return { data: { user: cred.user, session: { user: cred.user } }, error: null }; } catch (e) { return { data: null, error: mapError(e) }; } },
      async resetPasswordForEmail(email) { try { await sendPasswordResetEmail(auth, email); return { data: true, error: null }; } catch (e) { return { data: null, error: mapError(e) }; } },
      async signOut() { await signOut(auth); },
      async getSession() { return { data: { session: auth.currentUser ? { user: auth.currentUser } : null }, error: null }; },
      onAuthStateChange(callback) { const unsubscribe = onAuthStateChanged(auth, user => callback('AUTH_STATE_CHANGED', user ? { user } : null)); return { data: { subscription: { unsubscribe } } }; },
      _onChange: onAuthStateChanged
    },
    rpc(name, args) { if (name === 'create_organization') return createOrganization(args); if (name === 'close_day') return closeDay(args); if (name === 'reopen_day') return reopenDay(args); if (name === 'admin_add_member') return adminAddMember(args); return Promise.resolve({ data: null, error: { message: `RPC ${name} not implemented` } }); },
    channel() { const subscriptions = []; const stops = []; return { on(_event, config, callback) { subscriptions.push({ table: config.table, callback }); return this; }, subscribe(callback) { subscriptions.forEach(item => stops.push(onSnapshot(collection(db, item.table), () => item.callback()))); callback?.('SUBSCRIBED'); return this; }, _stops: stops }; },
    removeChannel(channel) { (channel?._stops || []).forEach(stop => stop?.()); }
  };
}
export { auth, db };
