const [base,head]=process.argv.slice(2);
const valid=base==='develop'
  ? /^(feature|bugfix|release|hotfix)\/.+/.test(head)||head==='master'
  : base==='master'&&/^(release|hotfix)\/.+/.test(head);
if(!valid){console.error('GitFlow: develop recibe feature/*, bugfix/*, release/*, hotfix/* o master; master recibe release/* o hotfix/*.');process.exitCode=1;}
else console.log('Ramas de la pull request compatibles con GitFlow.');
