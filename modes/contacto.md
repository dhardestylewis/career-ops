# Modo: contacto -- Outreach multi-lane

0. **Construir dossier antes de escribir**
   - No redactar ni enviar hasta completar un dossier por contacto con fuentes reales.
   - Campos minimos: persona / relacion, ultimo contacto real, por que ahora, hook especifico, proof point mio, ask pequeno, que evitar, estado, y regla de follow-up.
   - Fuentes minimas: Gmail, LinkedIn, web publica de 1 a 2 piezas, y contexto interno (CV / repo / notas).
   - Revisar el LinkedIn actual o la pagina de la organizacion antes de enviar. Si la persona cambio de rol, reescribir como reconnect / current-role note, no como follow-up de rol activo.
  - Antes de outreach sobre trabajo, dinero, gigs, contratos o jobs, revisar la afiliacion en el directorio pando de South Park Commons y en South Park Commons Slack. Si la persona es SPC-affiliated o el estado es incierto, no enviar ese pitch y usar solo un reconnect no laboral o dejarlo bloqueado.
  - Si Chrome ya tiene LinkedIn, Pando o Superhuman autenticados, usarlos primero y dejarlos como handoff para futuras sesiones. La login state no es permanente entre sesiones nuevas; el in-app browser queda como respaldo para Gmail.
  - Si falta un campo, el estado es `research` y no se envia.

1. **Cargar primero**
   - `data/outreach-operator-card.md`
   - `data/outreach-contact-dossier.md`
   - `data/outreach-drafts.md`
   - `data/outreach-targets.tsv`
   - `data/outreach-universe.tsv`
   - `data/outreach-queue.tsv`
   - `data/outreach-log.md`
   - `data/outreach-template-evidence.md`
   - `data/outreach-scripts.md`
   - `data/outreach-review.md`
   - `modes/_profile.md`

2. **Elegir lane**
   - warm academic / profesor / ex instructor
   - alumni / career services
   - recruiter
   - hiring manager
   - lab / research
   - nonprofit / public-sector
   - dormant warm tie
   - founder / ecosystem connector

3. **Clasificar el contacto**
   - **Recruiter**: talent acquisition, sourcing, recruiting, staffing
   - **Hiring Manager**: lider del equipo o del proyecto
   - **Professor / former instructor**: profesor, advisor, mentor academico
   - **Alumni / career services**: alumni office, career services, school staff
   - **Lab / researcher**: lab lead, PI, research staff, program lead
   - **Nonprofit / public-sector**: civic, government, housing, resilience, mission org
   - **Dormant warm tie**: hilo viejo que ya tuvo contexto
   - **Founder / ecosystem**: founder, operator, connector, community lead

4. **Seleccionar el target primario**
   - Elige la persona que tiene el puente mas directo hacia la oportunidad.
   - Si la fila en `data/outreach-queue.tsv` esta en `research`, primero resuelve la ruta.
   - Si el contacto esta bloqueado, registra el bloqueo y cambia de ruta.

5. **Redactar con el mismo esqueleto**
   - `hook sobre ellos -> 1 proof point sobre ti -> 1 ask pequeno`
   - Mantener LinkedIn en 300 caracteres o menos.
   - Usar email cuando haga falta un poco mas de contexto.
   - Personalizar la primera frase, no todo el mensaje.
   - En founder / ecosystem, abrir con el puente.
   - En alumni / career services, pedir direccion, no un favor grande.
   - En professor / former instructor, nombrar la clase, proyecto o investigacion compartida, o un trabajo publico concreto si existe (paper, charla, laboratorio, blog, editorship).
   - En recruiter, poner los screening facts al inicio.
   - En hiring manager, abrir con el problema del equipo o el trabajo reciente.
   - En lab / research, nombrar el tema o paper primero.
   - En nonprofit / public-sector, abrir con la mision o programa.
   - En dormant warm tie, recordar el contexto anterior antes de nada mas.
   - En outreach sobre trabajo, dinero, gigs, contratos o jobs, aplicar primero la afiliacion SPC y no hacer pitch laboral a contactos SPC-affiliated o inciertos.

6. **Usar los templates evidenciados**
   - Consultar `data/outreach-scripts.md` para copia lista para enviar.
   - Consultar `data/outreach-template-evidence.md` para la evidencia de por que funciona.
   - Si hace falta mas de un proof point, reescribir mas corto.

7. **Enviar y registrar**
   - Si el send path esta permitido, enviar.
   - Registrar el send inmediatamente en `data/outreach-log.md`.
   - No duplicar contactos que ya estan en `data/outreach-universe.tsv`.
   - No enviar si el dossier esta incompleto.

8. **Responder y seguir**
   - Si responden con un `yes/no` simple o una pregunta de agenda, contestar directo y breve.
   - Si la respuesta cambia la estrategia o es ambigua, parar y avisar al usuario.
   - Si no hay respuesta, seguir la cadencia de `modes/followup.md`.

**Reglas del mensaje**

- Maximo 300 caracteres para LinkedIn.
- No usar corporate-speak.
- No usar `I'm passionate about...`
- No usar `just checking in`, `touching base`, o `circling back` por defecto.
- No compartir telefono.
- El tipo de contacto cambia el enfasis, no la estructura.
