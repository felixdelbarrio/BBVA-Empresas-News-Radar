function properties_() { return PropertiesService.getScriptProperties(); }
function authorize_(admin) {
  const owner=properties_().getProperty('OWNER_EMAIL'),email=Session.getActiveUser().getEmail().trim().toLowerCase();
  if(!owner)throw new Error('Ejecuta setupRadar desde el editor de Apps Script.');
  if(!email || !email.endsWith('@bbva.com'))throw new Error('Accede con tu cuenta bbva.com. Google debe facilitar la identidad del usuario dentro del dominio.');
  const session={email,admin:email===owner};
  if(admin && !session.admin)throw new Error('Acceso no autorizado: se requiere administrador.');
  return session;
}
