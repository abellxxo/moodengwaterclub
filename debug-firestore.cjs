// Debug script — scan Firestore structure to find FCM tokens
const admin = require('./functions/node_modules/firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(require('./service-account.json')),
  projectId: 'water-tracker-kita'
});

async function debugFirestore() {
  const db = admin.firestore();
  
  console.log('🔍 Scanning top-level collections...');
  const collections = await db.listCollections();
  
  for (const col of collections) {
    console.log(`\n📁 Collection: ${col.id}`);
    const docs = await col.listDocuments();
    for (const docRef of docs) {
      console.log(`  📄 Doc: ${docRef.id}`);
      const subCols = await docRef.listCollections();
      for (const subCol of subCols) {
        console.log(`    📁 SubCol: ${subCol.id}`);
        const subDocs = await subCol.listDocuments();
        for (const subDocRef of subDocs) {
          console.log(`      📄 SubDoc: ${subDocRef.id}`);
          const subSubCols = await subDocRef.listCollections();
          for (const subSubCol of subSubCols) {
            console.log(`        📁 SubSubCol: ${subSubCol.id}`);
            const subSubDocs = await subSubCol.listDocuments();
            for (const subSubDocRef of subSubDocs) {
              console.log(`          📄 SubSubDoc: ${subSubDocRef.id}`);
              const subSubSubCols = await subSubDocRef.listCollections();
              for (const leaf of subSubSubCols) {
                console.log(`            📁 LeafCol: ${leaf.id}`);
                const leafDocs = await leaf.listDocuments();
                for (const leafDoc of leafDocs) {
                  const data = await leafDoc.get();
                  if (data.exists) {
                    const d = data.data();
                    if (d.token) console.log(`              ✅ TOKEN FOUND: ${leafDoc.id} → ${d.token.substring(0,30)}...`);
                    else console.log(`              📄 ${leafDoc.id}:`, JSON.stringify(d).substring(0, 80));
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  process.exit(0);
}

debugFirestore().catch(err => { console.error(err); process.exit(1); });
