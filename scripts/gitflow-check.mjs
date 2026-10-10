const [base,head,baseRepository,headRepository]=process.argv.slice(2);
const valid=Boolean(head&&baseRepository&&headRepository)&&(base==='develop'
  ? head!==base
  : base==='master'&&head==='develop'&&headRepository===baseRepository);
if(!valid){console.error('GitFlow: develop solo recibe PRs desde otra rama; master solo recibe PRs desde develop del mismo repositorio.');process.exitCode=1;}
else console.log('Ramas de la pull request compatibles con GitFlow.');
