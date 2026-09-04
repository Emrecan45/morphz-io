import { GAME_NAME, AUTHOR } from './brand.js'

const LEGAL = {
  fr: {
    privacy: {
      title: 'Confidentialité',
      body: `
        <h4>1. Ce que ${GAME_NAME} collecte</h4>
        <p>Aucun compte n'est nécessaire pour jouer. Le jeu ne demande ni nom réel, ni adresse postale, ni numéro de téléphone, ni moyen de paiement.</p>
        <h4>2. Données gardées sur votre appareil</h4>
        <p>Le pseudo, le mode choisi, la langue et le volume sont enregistrés dans le stockage local du navigateur. Ces données restent sur l'appareil et ne sont envoyées nulle part. Vider les données du site les efface.</p>
        <h4>3. Données techniques</h4>
        <p>Pour établir la connexion à une partie, le serveur reçoit l'adresse IP et les informations transmises automatiquement par le navigateur. Cela sert uniquement à faire tourner la partie et à bloquer les robots. Rien n'est revendu.</p>
        <h4>4. Hébergement</h4>
        <p>Le jeu et ses serveurs de partie sont hébergés par Cloudflare, qui applique sa propre politique de confidentialité. La vérification anti-robot utilise Cloudflare Turnstile en mode invisible, couvert par l’<a href="https://www.cloudflare.com/turnstile-privacy-policy/" target="_blank" rel="noopener">addendum de confidentialité Turnstile</a> de Cloudflare. Les messages du formulaire sont acheminés par Resend.</p>
        <h4>5. Formulaire de contact</h4>
        <p>Les messages envoyés via le formulaire sont transmis par e-mail au développeur, avec leur sujet. L'adresse e-mail est facultative : elle peut être laissée vide, et n'est utile que pour obtenir une réponse. Rien n'alimente une liste de diffusion.</p>
        <h4>6. Cookies et publicité</h4>
        <p>Le jeu lui-même ne pose aucun cookie publicitaire et ne constitue aucun profil de joueur. En revanche, les portails qui l'hébergent affichent leurs propres publicités et posent leurs propres cookies, sur lesquels je n'ai aucune main. Sur ces sites, c'est la politique de confidentialité du portail qui s'applique en plus de celle-ci. Sur CrazyGames et Y8, le jeu charge en plus le kit de développement du portail, qui gère l'affichage des publicités : voir la <a href="https://www.crazygames.com/privacy-policy" target="_blank" rel="noopener">politique de confidentialité de CrazyGames</a> et celle d'<a href="https://www.y8.com/privacy" target="_blank" rel="noopener">Y8</a>.</p>
        <h4>7. Enfants</h4>
        <p>Le jeu ne s'adresse pas spécifiquement aux moins de 13 ans et ne collecte volontairement aucune donnée les concernant. Une donnée de ce type qui parviendrait au développeur serait supprimée sur simple demande.</p>
        <h4>8. Vos droits</h4>
        <p>Aucune donnée n'étant conservée sous une identité, il n'existe aucun dossier à consulter ni à effacer. Toute question peut être adressée via le formulaire de contact.</p>
        <h4>9. Modifications</h4>
        <p>Cette page évolue avec le jeu. La version affichée ici est toujours celle en vigueur.</p>`,
    },
    terms: {
      title: 'Conditions d\'utilisation',
      body: `
        <h4>1. Acceptation</h4>
        <p>Jouer à ${GAME_NAME} vaut acceptation des règles ci-dessous. En cas de désaccord, il convient de ne pas utiliser le jeu.</p>
        <h4>2. Licence</h4>
        <p>${GAME_NAME} est gratuit et accorde un droit d'usage personnel et non commercial. Il est interdit de vendre, redistribuer ou héberger une copie du jeu.</p>
        <h4>3. Jeu loyal</h4>
        <p>Les triches, scripts, robots, clients modifiés et l'exploitation volontaire de bugs sont interdits. Ils peuvent entraîner une exclusion immédiate et définitive, sans avertissement.</p>
        <h4>4. Pseudos et comportement</h4>
        <p>Le pseudo choisi ne doit être ni insultant, ni haineux, ni sexuel, ni destiné à usurper l'identité d'autrui. Tout pseudo peut être filtré ou refusé.</p>
        <h4>5. Disponibilité</h4>
        <p>Le jeu est fourni tel quel, sans garantie de disponibilité. Les parties, les serveurs et l'équilibrage peuvent changer, s'interrompre ou fermer à tout moment sans préavis.</p>
        <h4>6. Propriété</h4>
        <p>Le code, les visuels et le nom ${GAME_NAME} appartiennent à leur auteur. La musique et les polices viennent de ressources tierces et gardent la licence indiquée dans les crédits, accessibles depuis le pied de page du menu.</p>
        <h4>7. Responsabilité</h4>
        <p>Le jeu est proposé sans aucune garantie. L'auteur ne peut être tenu responsable d'une perte de progression, d'une interruption de service ou d'un dommage lié à l'utilisation du jeu.</p>
        <h4>8. Modifications</h4>
        <p>Ces conditions peuvent être mises à jour. Continuer à jouer après une mise à jour vaut acceptation de la nouvelle version.</p>
        <h4>9. Contact</h4>
        <p>Toute question relative à ces conditions peut être adressée via le formulaire de contact.</p>`,
    },
  },

  en: {
    privacy: {
      title: 'Privacy',
      body: `
        <h4>1. What ${GAME_NAME} collects</h4>
        <p>No account is needed to play. The game never asks for a real name, a postal address, a phone number or a payment method.</p>
        <h4>2. Data kept on the device</h4>
        <p>The nickname, the chosen mode, the language and the volume are saved in the browser local storage. This data stays on the device and is sent nowhere. Clearing the site data erases them.</p>
        <h4>3. Technical data</h4>
        <p>To establish a match connection, the server receives the IP address and whatever the browser sends automatically. It is used only to run the match and to block bots. Nothing is sold.</p>
        <h4>4. Hosting</h4>
        <p>The game and its match servers are hosted by Cloudflare, which applies its own privacy policy. The anti-bot check uses Cloudflare Turnstile in invisible mode, covered by Cloudflare’s <a href="https://www.cloudflare.com/turnstile-privacy-policy/" target="_blank" rel="noopener">Turnstile Privacy Addendum</a>. Messages from the form are delivered by Resend.</p>
        <h4>5. Contact form</h4>
        <p>Messages sent through the form are forwarded by email to the developer, along with their subject. The email address is optional: it may be left empty, and is only needed to receive an answer. Nothing feeds a mailing list.</p>
        <h4>6. Cookies and advertising</h4>
        <p>The game itself sets no advertising cookie and builds no player profile. The portals that host it do show their own advertising and set their own cookies, which are outside my control. On those sites the portal privacy policy applies on top of this one. On CrazyGames and Y8 the game also loads the portal software kit, which handles the advertising: see the <a href="https://www.crazygames.com/privacy-policy" target="_blank" rel="noopener">CrazyGames privacy policy</a> and the <a href="https://www.y8.com/privacy" target="_blank" rel="noopener">Y8 privacy policy</a>.</p>
        <h4>7. Children</h4>
        <p>The game is not aimed at children under 13 and does not knowingly collect their data. Any such data reaching the developer is deleted on request.</p>
        <h4>8. Rights</h4>
        <p>As no data is held under an identity, there is no file to review or erase. Any question may be raised through the contact form.</p>
        <h4>9. Changes</h4>
        <p>This page changes along with the game. The version shown here is always the one in force.</p>`,
    },
    terms: {
      title: 'Terms of service',
      body: `
        <h4>1. Acceptance</h4>
        <p>Playing ${GAME_NAME} constitutes acceptance of the rules below. In case of disagreement, the game should not be used.</p>
        <h4>2. Licence</h4>
        <p>${GAME_NAME} is free and grants a personal, non commercial right of use. Selling, redistributing or hosting a copy of the game is prohibited.</p>
        <h4>3. Fair play</h4>
        <p>Cheats, scripts, bots, modified clients and the deliberate abuse of bugs are forbidden. They can lead to an immediate and permanent ban, without warning.</p>
        <h4>4. Nicknames and behaviour</h4>
        <p>The chosen nickname must not be insulting, hateful, sexual or intended to impersonate anyone. Any nickname can be filtered or refused.</p>
        <h4>5. Availability</h4>
        <p>The game is provided as is, with no guarantee of availability. Matches, servers and balance can change, stop or shut down at any time without notice.</p>
        <h4>6. Ownership</h4>
        <p>The code, the artwork and the name ${GAME_NAME} belong to their author. The music and the fonts come from third party assets and keep the licence stated in the credits, reachable from the menu footer.</p>
        <h4>7. Liability</h4>
        <p>The game comes with no warranty of any kind. The author cannot be held liable for lost progress, service interruption or any damage linked to the use of the game.</p>
        <h4>8. Changes</h4>
        <p>These terms can be updated. Playing on after an update counts as accepting the new version.</p>
        <h4>9. Contact</h4>
        <p>Any question regarding these terms may be raised through the contact form.</p>`,
    },
  },

  es: {
    privacy: {
      title: 'Privacidad',
      body: `
        <h4>1. Lo que recoge ${GAME_NAME}</h4>
        <p>No hace falta ninguna cuenta para jugar. El juego nunca pide nombre real, dirección postal, teléfono ni medio de pago.</p>
        <h4>2. Datos guardados en el dispositivo</h4>
        <p>El apodo, el modo elegido, el idioma y el volumen se guardan en el almacenamiento local del navegador. Estos datos permanecen en el dispositivo y no se envían a ningún sitio. Borrar los datos del sitio los elimina.</p>
        <h4>3. Datos técnicos</h4>
        <p>Para establecer la conexión a una partida, el servidor recibe la dirección IP y lo que el navegador envía automáticamente. Solo sirve para hacer funcionar la partida y bloquear robots. Nada se vende.</p>
        <h4>4. Alojamiento</h4>
        <p>El juego y sus servidores de partida están alojados en Cloudflare, que aplica su propia política de privacidad. La verificación anti robot usa Cloudflare Turnstile en modo invisible, cubierto por el <a href="https://www.cloudflare.com/turnstile-privacy-policy/" target="_blank" rel="noopener">addendum de privacidad de Turnstile</a> de Cloudflare. Los mensajes del formulario se entregan mediante Resend.</p>
        <h4>5. Formulario de contacto</h4>
        <p>Los mensajes enviados mediante el formulario se remiten por correo al desarrollador, junto con su asunto. El correo electrónico es opcional: puede dejarse vacío, y solo sirve para recibir una respuesta. Nada alimenta una lista de correo.</p>
        <h4>6. Cookies y publicidad</h4>
        <p>El juego en sí no pone ninguna cookie publicitaria ni crea ningún perfil de jugador. En cambio, los portales que lo alojan muestran su propia publicidad y ponen sus propias cookies, sobre las que no tengo control. En esos sitios se aplica la política de privacidad del portal además de esta. En CrazyGames y Y8 el juego carga además el kit de desarrollo del portal, que gestiona la publicidad: consulta la <a href="https://www.crazygames.com/privacy-policy" target="_blank" rel="noopener">política de privacidad de CrazyGames</a> y la de <a href="https://www.y8.com/privacy" target="_blank" rel="noopener">Y8</a>.</p>
        <h4>7. Menores</h4>
        <p>El juego no se dirige a menores de 13 años y no recoge conscientemente sus datos. Cualquier dato de ese tipo que nos llegue se borra a petición.</p>
        <h4>8. Derechos</h4>
        <p>Como no se conserva ningún dato bajo una identidad, no existe expediente que consultar ni borrar. Cualquier duda puede plantearse mediante el formulario de contacto.</p>
        <h4>9. Cambios</h4>
        <p>Esta página evoluciona con el juego. La versión mostrada aquí es siempre la vigente.</p>`,
    },
    terms: {
      title: 'Términos de uso',
      body: `
        <h4>1. Aceptación</h4>
        <p>Jugar a ${GAME_NAME} supone la aceptación de las reglas siguientes. En caso de desacuerdo, conviene no utilizar el juego.</p>
        <h4>2. Licencia</h4>
        <p>${GAME_NAME} es gratuito y concede un derecho de uso personal y no comercial. Queda prohibido vender, redistribuir o alojar una copia del juego.</p>
        <h4>3. Juego limpio</h4>
        <p>Trampas, scripts, robots, clientes modificados y el abuso deliberado de fallos están prohibidos. Pueden acarrear una exclusión inmediata y definitiva, sin aviso.</p>
        <h4>4. Apodos y conducta</h4>
        <p>El apodo elegido no debe ser insultante, de odio, sexual ni destinado a suplantar a nadie. Cualquier apodo puede ser filtrado o rechazado.</p>
        <h4>5. Disponibilidad</h4>
        <p>El juego se ofrece tal cual, sin garantía de disponibilidad. Partidas, servidores y equilibrio pueden cambiar, cortarse o cerrar en cualquier momento sin previo aviso.</p>
        <h4>6. Propiedad</h4>
        <p>El código, los gráficos y el nombre ${GAME_NAME} pertenecen a su autor. La música y las tipografías vienen de recursos de terceros y conservan la licencia indicada en los créditos, accesibles desde el pie del menú.</p>
        <h4>7. Responsabilidad</h4>
        <p>El juego se ofrece sin garantía alguna. El autor no puede ser considerado responsable de una pérdida de progreso, una interrupción del servicio o un daño ligado al uso del juego.</p>
        <h4>8. Cambios</h4>
        <p>Estos términos pueden actualizarse. Seguir jugando tras una actualización equivale a aceptar la nueva versión.</p>
        <h4>9. Contacto</h4>
        <p>Cualquier duda sobre estos términos puede plantearse mediante el formulario de contacto.</p>`,
    },
  },

  de: {
    privacy: {
      title: 'Datenschutz',
      body: `
        <h4>1. Was ${GAME_NAME} erfasst</h4>
        <p>Zum Spielen ist kein Konto nötig. Das Spiel fragt nie nach echtem Namen, Anschrift, Telefonnummer oder Zahlungsmittel.</p>
        <h4>2. Daten auf dem Gerät</h4>
        <p>Spitzname, gewählter Modus, Sprache und Lautstärke liegen im lokalen Speicher des Browsers. Diese Daten bleiben auf dem Gerät und werden nirgendwohin gesendet. Das Löschen der Seitendaten entfernt sie.</p>
        <h4>3. Technische Daten</h4>
        <p>Für den Aufbau einer Partieverbindung erhält der Server die IP-Adresse und das, was der Browser automatisch sendet. Das dient nur dem Betrieb der Partie und dem Blocken von Bots. Nichts wird verkauft.</p>
        <h4>4. Hosting</h4>
        <p>Das Spiel und seine Partie-Server laufen bei Cloudflare, das seine eigene Datenschutzerklärung anwendet. Die Bot-Prüfung nutzt Cloudflare Turnstile im unsichtbaren Modus, abgedeckt durch den <a href="https://www.cloudflare.com/turnstile-privacy-policy/" target="_blank" rel="noopener">Turnstile-Datenschutzzusatz</a> von Cloudflare. Nachrichten aus dem Formular werden über Resend zugestellt.</p>
        <h4>5. Kontaktformular</h4>
        <p>Über das Formular gesendete Nachrichten gehen samt Betreff per E-Mail an den Entwickler. Die E-Mail-Adresse ist optional: sie kann leer bleiben und dient allein dem Erhalt einer Antwort. Nichts landet in einem Verteiler.</p>
        <h4>6. Cookies und Werbung</h4>
        <p>Das Spiel selbst setzt kein Werbe-Cookie und erstellt kein Spielerprofil. Die Portale, die es hosten, zeigen jedoch eigene Werbung und setzen eigene Cookies, auf die ich keinen Einfluss habe. Auf diesen Seiten gilt zusätzlich die Datenschutzerklärung des Portals. Auf CrazyGames und Y8 lädt das Spiel zusätzlich das Entwicklungskit des Portals, das die Werbung steuert: siehe die <a href="https://www.crazygames.com/privacy-policy" target="_blank" rel="noopener">Datenschutzerklärung von CrazyGames</a> und die von <a href="https://www.y8.com/privacy" target="_blank" rel="noopener">Y8</a>.</p>
        <h4>7. Kinder</h4>
        <p>Das Spiel richtet sich nicht an Kinder unter 13 Jahren und erhebt wissentlich keine Daten von ihnen. Solche Daten werden auf Anfrage gelöscht.</p>
        <h4>8. Rechte</h4>
        <p>Da keine Daten unter einer Identität gespeichert werden, gibt es keine Akte zum Einsehen oder Löschen. Fragen können über das Kontaktformular gestellt werden.</p>
        <h4>9. Änderungen</h4>
        <p>Diese Seite entwickelt sich mit dem Spiel. Die hier angezeigte Fassung ist immer die geltende.</p>`,
    },
    terms: {
      title: 'Nutzungsbedingungen',
      body: `
        <h4>1. Zustimmung</h4>
        <p>Das Spielen von ${GAME_NAME} gilt als Zustimmung zu den folgenden Regeln. Bei Nichteinverständnis ist das Spiel nicht zu nutzen.</p>
        <h4>2. Lizenz</h4>
        <p>${GAME_NAME} ist kostenlos und gewährt ein persönliches, nicht kommerzielles Nutzungsrecht. Der Verkauf, die Weitergabe und das Hosten einer Kopie des Spiels sind untersagt.</p>
        <h4>3. Faires Spiel</h4>
        <p>Cheats, Skripte, Bots, veränderte Clients und das absichtliche Ausnutzen von Fehlern sind verboten. Sie können ohne Vorwarnung zu einem sofortigen und dauerhaften Ausschluss führen.</p>
        <h4>4. Spitznamen und Verhalten</h4>
        <p>Der gewählte Name darf weder beleidigend, hasserfüllt oder sexuell sein noch jemanden nachahmen. Jeder Name kann gefiltert oder abgelehnt werden.</p>
        <h4>5. Verfügbarkeit</h4>
        <p>Das Spiel wird wie besehen bereitgestellt, ohne Verfügbarkeitsgarantie. Partien, Server und Balance können sich jederzeit ohne Vorankündigung ändern, ausfallen oder enden.</p>
        <h4>6. Eigentum</h4>
        <p>Code, Grafiken und der Name ${GAME_NAME} gehören ihrem Urheber. Musik und Schriften stammen von fremden Inhalten und behalten die in den Credits genannte Lizenz, erreichbar über die Fußzeile des Menüs.</p>
        <h4>7. Haftung</h4>
        <p>Das Spiel kommt ohne jede Gewährleistung. Der Urheber haftet nicht für verlorenen Fortschritt, Dienstunterbrechungen oder Schäden im Zusammenhang mit der Nutzung.</p>
        <h4>8. Änderungen</h4>
        <p>Diese Bedingungen können aktualisiert werden. Weiterspielen nach einer Aktualisierung gilt als Zustimmung zur neuen Fassung.</p>
        <h4>9. Kontakt</h4>
        <p>Fragen zu diesen Bedingungen können über das Kontaktformular gestellt werden.</p>`,
    },
  },

  pt: {
    privacy: {
      title: 'Privacidade',
      body: `
        <h4>1. O que o ${GAME_NAME} recolhe</h4>
        <p>Não é preciso conta para jogar. O jogo nunca pede nome real, morada, telefone nem meio de pagamento.</p>
        <h4>2. Dados guardados no aparelho</h4>
        <p>O apelido, o modo escolhido, o idioma e o volume ficam no armazenamento local do navegador. Estes dados permanecem no aparelho e não são enviados a lado nenhum. Limpar os dados do site apaga-os.</p>
        <h4>3. Dados técnicos</h4>
        <p>Para estabelecer a ligação a uma partida, o servidor recebe o endereço IP e o que o navegador envia automaticamente. Serve apenas para correr a partida e bloquear robôs. Nada é vendido.</p>
        <h4>4. Alojamento</h4>
        <p>O jogo e os seus servidores de partida são alojados pela Cloudflare, que aplica a sua própria política de privacidade. A verificação anti robô usa Cloudflare Turnstile em modo invisível, abrangido pelo <a href="https://www.cloudflare.com/turnstile-privacy-policy/" target="_blank" rel="noopener">adendo de privacidade Turnstile</a> da Cloudflare. As mensagens do formulário são entregues pela Resend.</p>
        <h4>5. Formulário de contacto</h4>
        <p>As mensagens enviadas pelo formulário seguem por e-mail para o programador, juntamente com o respetivo assunto. O e-mail é opcional: pode ser deixado vazio, e serve apenas para obter uma resposta. Nada alimenta uma lista de difusão.</p>
        <h4>6. Cookies e publicidade</h4>
        <p>O jogo em si não coloca cookies publicitários nem cria qualquer perfil de jogador. Já os portais que o alojam mostram publicidade própria e colocam os seus próprios cookies, sobre os quais não tenho controlo. Nesses sites aplica-se a política de privacidade do portal além desta. No CrazyGames e no Y8 o jogo carrega ainda o kit de desenvolvimento do portal, que trata da publicidade: ver a <a href="https://www.crazygames.com/privacy-policy" target="_blank" rel="noopener">política de privacidade da CrazyGames</a> e a da <a href="https://www.y8.com/privacy" target="_blank" rel="noopener">Y8</a>.</p>
        <h4>7. Crianças</h4>
        <p>O jogo não se dirige a menores de 13 anos e não recolhe conscientemente os seus dados. Qualquer dado desse tipo que chegue ao programador é apagado a pedido.</p>
        <h4>8. Direitos</h4>
        <p>Como nenhum dado é guardado sob uma identidade, não existe ficheiro para consultar nem apagar. Qualquer questão pode ser colocada através do formulário de contacto.</p>
        <h4>9. Alterações</h4>
        <p>Esta página evolui com o jogo. A versão aqui mostrada é sempre a que está em vigor.</p>`,
    },
    terms: {
      title: 'Termos de utilização',
      body: `
        <h4>1. Aceitação</h4>
        <p>Jogar ${GAME_NAME} implica a aceitação das regras abaixo. Em caso de desacordo, o jogo não deve ser utilizado.</p>
        <h4>2. Licença</h4>
        <p>${GAME_NAME} é gratuito e concede um direito de uso pessoal e não comercial. É proibido vender, redistribuir ou alojar uma cópia do jogo.</p>
        <h4>3. Jogo limpo</h4>
        <p>Batotas, scripts, robôs, clientes modificados e o abuso deliberado de falhas são proibidos. Podem levar a uma exclusão imediata e definitiva, sem aviso.</p>
        <h4>4. Apelidos e comportamento</h4>
        <p>O apelido escolhido não deve ser insultuoso, de ódio, sexual nem destinado a fazer-se passar por alguém. Qualquer apelido pode ser filtrado ou recusado.</p>
        <h4>5. Disponibilidade</h4>
        <p>O jogo é fornecido tal como está, sem garantia de disponibilidade. Partidas, servidores e equilíbrio podem mudar, parar ou encerrar a qualquer momento sem aviso.</p>
        <h4>6. Propriedade</h4>
        <p>O código, os visuais e o nome ${GAME_NAME} pertencem ao seu autor. A música e as fontes vêm de recursos de terceiros e mantêm a licença indicada nos créditos, acessíveis no rodapé do menu.</p>
        <h4>7. Responsabilidade</h4>
        <p>O jogo é oferecido sem qualquer garantia. O autor não pode ser responsabilizado por perda de progresso, interrupção do serviço ou dano ligado ao uso do jogo.</p>
        <h4>8. Alterações</h4>
        <p>Estes termos podem ser atualizados. Continuar a jogar após uma atualização vale como aceitação da nova versão.</p>
        <h4>9. Contacto</h4>
        <p>Qualquer questão sobre estes termos pode ser colocada através do formulário de contacto.</p>`,
    },
  },

  ru: {
    privacy: {
      title: 'Конфиденциальность',
      body: `
        <h4>1. Что собирает ${GAME_NAME}</h4>
        <p>Для игры не нужен аккаунт. Игра никогда не просит настоящее имя, почтовый адрес, телефон или платёжные данные.</p>
        <h4>2. Данные на устройстве</h4>
        <p>Ник, выбранный режим, язык и громкость хранятся в локальном хранилище браузера. Эти данные остаются на устройстве и никуда не отправляются. Очистка данных сайта их удаляет.</p>
        <h4>3. Технические данные</h4>
        <p>Для установки соединения с матчем сервер получает IP-адрес и то, что браузер отправляет автоматически. Это нужно только для работы матча и блокировки ботов. Ничего не продаётся.</p>
        <h4>4. Хостинг</h4>
        <p>Игра и её игровые серверы размещены у Cloudflare, у которого своя политика конфиденциальности. Проверка на ботов использует Cloudflare Turnstile в невидимом режиме, на который распространяется <a href="https://www.cloudflare.com/turnstile-privacy-policy/" target="_blank" rel="noopener">дополнение о конфиденциальности Turnstile</a> от Cloudflare. Сообщения из формы доставляет Resend.</p>
        <h4>5. Форма обратной связи</h4>
        <p>Сообщения, отправленные через форму, уходят письмом разработчику вместе с темой. Адрес почты необязателен: его можно оставить пустым, он нужен только для получения ответа. Ничего не идёт в рассылку.</p>
        <h4>6. Куки и реклама</h4>
        <p>Сама игра не ставит рекламных куки и не создаёт профиль игрока. Но порталы, где она размещена, показывают собственную рекламу и ставят собственные куки, которые мне неподконтрольны. На этих сайтах вдобавок к этой действует политика конфиденциальности портала. На CrazyGames и Y8 игра дополнительно загружает набор разработчика портала, который управляет показом рекламы: смотрите <a href="https://www.crazygames.com/privacy-policy" target="_blank" rel="noopener">политику конфиденциальности CrazyGames</a> и <a href="https://www.y8.com/privacy" target="_blank" rel="noopener">Y8</a>.</p>
        <h4>7. Дети</h4>
        <p>Игра не адресована детям младше 13 лет и сознательно не собирает их данные. Любые такие данные удаляются по запросу.</p>
        <h4>8. Твои права</h4>
        <p>Поскольку никакие данные не хранятся под какой-либо личностью, нет дела, которое можно запросить или удалить. По любым вопросам следует обращаться через форму обратной связи.</p>
        <h4>9. Изменения</h4>
        <p>Эта страница меняется вместе с игрой. Показанная здесь версия всегда действующая.</p>`,
    },
    terms: {
      title: 'Условия использования',
      body: `
        <h4>1. Принятие</h4>
        <p>Игра в ${GAME_NAME} означает принятие правил ниже. При несогласии игру использовать не следует.</p>
        <h4>2. Лицензия</h4>
        <p>${GAME_NAME} бесплатна и даёт право личного некоммерческого использования. Нельзя продавать, распространять или размещать копию игры.</p>
        <h4>3. Честная игра</h4>
        <p>Читы, скрипты, боты, изменённые клиенты и намеренное использование багов запрещены. Это может привести к немедленной и постоянной блокировке без предупреждения.</p>
        <h4>4. Ники и поведение</h4>
        <p>Выбирай ник, который не оскорбляет, не разжигает ненависть, не носит сексуальный характер и не выдаёт себя за другого. Любой ник может быть отфильтрован или отклонён.</p>
        <h4>5. Доступность</h4>
        <p>Игра предоставляется как есть, без гарантии доступности. Матчи, серверы и баланс могут измениться, прерваться или закрыться в любой момент без предупреждения.</p>
        <h4>6. Права</h4>
        <p>Код, графика и название ${GAME_NAME} принадлежат автору. Музыка и шрифты взяты из сторонних ресурсов и сохраняют лицензию, указанную в титрах, доступных внизу меню.</p>
        <h4>7. Ответственность</h4>
        <p>Игра поставляется без каких-либо гарантий. Автор не несёт ответственности за потерю прогресса, перебои в работе или ущерб, связанный с использованием игры.</p>
        <h4>8. Изменения</h4>
        <p>Эти условия могут обновляться. Продолжение игры после обновления означает принятие новой версии.</p>
        <h4>9. Связь</h4>
        <p>Вопросы по этим условиям можно направить через форму обратной связи.</p>`,
    },
  },

  tr: {
    privacy: {
      title: 'Gizlilik',
      body: `
        <h4>1. ${GAME_NAME} neyi topluyor</h4>
        <p>Oynamak için hesap gerekmez. Oyun asla gerçek ad, posta adresi, telefon numarası veya ödeme bilgisi istemez.</p>
        <h4>2. Cihazında kalan veriler</h4>
        <p>Takma adın, seçtiğin mod, dil ve ses seviyesi tarayıcının yerel depolamasında saklanır. Sende kalır ve hiçbir yere gönderilmez. Site verilerini temizlemek onları siler.</p>
        <h4>3. Teknik veriler</h4>
        <p>Bir maça bağlanman için sunucu IP adresini ve tarayıcının otomatik gönderdiği bilgileri alır. Bunlar yalnızca maçı çalıştırmak ve botları engellemek içindir. Hiçbir şey satılmaz.</p>
        <h4>4. Barındırma</h4>
        <p>Oyun ve maç sunucuları Cloudflare üzerinde barındırılır, kendi gizlilik politikası geçerlidir. Bot kontrolü, Cloudflare Turnstile’ı görünmez modda kullanır; bu, Cloudflare’ın <a href="https://www.cloudflare.com/turnstile-privacy-policy/" target="_blank" rel="noopener">Turnstile Gizlilik Eki</a> kapsamındadır. Formdan gelen mesajlar Resend ile iletilir.</p>
        <h4>5. İletişim formu</h4>
        <p>Form üzerinden gönderilen mesajlar, konusuyla birlikte e-posta ile geliştiriciye iletilir. E-posta adresi isteğe bağlıdır: boş bırakılabilir ve yalnızca yanıt almak için gereklidir. Hiçbir şey posta listesine gitmez.</p>
        <h4>6. Çerezler ve reklam</h4>
        <p>Oyunun kendisi reklam çerezi koymaz ve oyuncu profili oluşturmaz. Ancak oyunu barındıran portallar kendi reklamlarını gösterir ve kendi çerezlerini koyar; bunlar benim denetimimde değildir. O sitelerde bu metne ek olarak portalın gizlilik politikası geçerlidir. CrazyGames ve Y8 üzerinde oyun ayrıca portalın geliştirici kitini yükler; reklamları o yönetir: <a href="https://www.crazygames.com/privacy-policy" target="_blank" rel="noopener">CrazyGames gizlilik politikası</a> ve <a href="https://www.y8.com/privacy" target="_blank" rel="noopener">Y8 gizlilik politikası</a>.</p>
        <h4>7. Çocuklar</h4>
        <p>Oyun 13 yaş altına yönelik değildir ve bilerek onların verisini toplamaz. Bize ulaşan böyle bir veri talep üzerine silinir.</p>
        <h4>8. Hakların</h4>
        <p>Kimliğin altında hiçbir şey saklanmadığı için incelenecek veya silinecek bir dosya yoktur. Her türlü soru için iletişim formunu kullan.</p>
        <h4>9. Değişiklikler</h4>
        <p>Bu sayfa oyunla birlikte değişir. Burada gösterilen sürüm her zaman yürürlükte olandır.</p>`,
    },
    terms: {
      title: 'Kullanım koşulları',
      body: `
        <h4>1. Kabul</h4>
        <p>${GAME_NAME} oynamak, aşağıdaki kuralların kabul edildiği anlamına gelir. Katılmıyorsanız oyun kullanılmamalıdır.</p>
        <h4>2. Lisans</h4>
        <p>${GAME_NAME} ücretsizdir ve kişisel, ticari olmayan bir kullanım hakkı tanır. Oyunun bir kopyasının satılması, dağıtılması veya barındırılması yasaktır.</p>
        <h4>3. Adil oyun</h4>
        <p>Hileler, betikler, botlar, değiştirilmiş istemciler ve hataların kasıtlı kullanımı yasaktır. Uyarı olmadan anında ve kalıcı bir engellemeye yol açabilir.</p>
        <h4>4. Takma adlar ve davranış</h4>
        <p>Hakaret içeren, nefret söylemi olan, cinsel ya da başkasının kimliğine bürünen bir takma ad seçme. Her takma ad filtrelenebilir veya reddedilebilir.</p>
        <h4>5. Erişilebilirlik</h4>
        <p>Oyun olduğu gibi sunulur, erişim garantisi yoktur. Maçlar, sunucular ve denge herhangi bir anda haber verilmeden değişebilir, kesilebilir veya kapanabilir.</p>
        <h4>6. Mülkiyet</h4>
        <p>Kod, görseller ve ${GAME_NAME} adı yazarına aittir. Müzik ve yazı tipleri üçüncü taraf kaynaklardan gelir ve menünün altından ulaşılan jenerikte belirtilen lisansı korur.</p>
        <h4>7. Sorumluluk</h4>
        <p>Oyun hiçbir garanti olmadan sunulur. Yazar, ilerleme kaybı, hizmet kesintisi veya oyunun kullanımına bağlı bir zarardan sorumlu tutulamaz.</p>
        <h4>8. Değişiklikler</h4>
        <p>Bu koşullar güncellenebilir. Bir güncellemeden sonra oynamayı sürdürmek yeni sürümü kabul etmek anlamına gelir.</p>
        <h4>9. İletişim</h4>
        <p>Bu koşullar hakkında soru mu var? İletişim formunu kullan.</p>`,
    },
  },
}

const CREDITS = {
  fr: {
    title: 'Crédits',
    art: 'Visuels',
    artText: `Tous les visuels de ${GAME_NAME} sont des créations originales. Aucun modèle 3D, aucune texture, aucun sprite et aucun jeu d'icônes extérieur n'est utilisé. Les créatures, les icônes et le logo sont dessinés pour ce jeu.`,
    fonts: 'Polices',
    sound: 'Musique',
    soundText: `Le jeu n'a aucun bruitage. Sa seule bande son est une boucle placée dans le domaine public sous licence Creative Commons Zero. CC0 n'exige rien en retour, ce crédit est donné par respect du travail. La musique se coupe depuis le menu.`,
    tools: 'Outils et services',
    hosting: 'hébergement du jeu, serveurs de partie et protection anti robot',
    mail: 'acheminement des messages du formulaire de contact',
    words: 'filtrage des pseudos',
    dev: 'Développeur',
    devText: `${AUTHOR} - conception, programmation, équilibrage et direction artistique.`,
  },
  en: {
    title: 'Credits',
    art: 'Artwork',
    artText: `Every visual in ${GAME_NAME} is original work. No external 3D model, no imported texture, no sprite and no icon set is used. The creatures, the icons and the logo are drawn for this game.`,
    fonts: 'Fonts',
    sound: 'Music',
    soundText: `The game has no sound effects. Its only audio is one loop released into the public domain under Creative Commons Zero. CC0 asks for nothing in return, this credit is given out of respect for the work. The music can be muted from the menu.`,
    tools: 'Tools and services',
    hosting: 'game hosting, match servers and bot protection',
    mail: 'delivery of the contact form messages',
    words: 'nickname filtering',
    dev: 'Developer',
    devText: `${AUTHOR} - design, programming, balancing and art direction.`,
  },
  es: {
    title: 'Créditos',
    art: 'Gráficos',
    artText: `Todos los gráficos de ${GAME_NAME} son creaciones originales. No se usa ningún modelo 3D externo, ninguna textura importada, ningún sprite ni ningún juego de iconos. Las criaturas, los iconos y el logotipo están dibujados para este juego.`,
    fonts: 'Tipografías',
    sound: 'Música',
    soundText: `El juego no tiene efectos de sonido. Su única banda sonora es un bucle liberado al dominio público bajo licencia Creative Commons Zero. CC0 no exige nada a cambio, este crédito se da por respeto al trabajo. La música se silencia desde el menú.`,
    tools: 'Herramientas y servicios',
    hosting: 'alojamiento del juego, servidores de partida y protección anti robot',
    mail: 'entrega de los mensajes del formulario de contacto',
    words: 'filtrado de apodos',
    dev: 'Desarrollador',
    devText: `${AUTHOR} - diseño, programación, equilibrio y dirección artística.`,
  },
  de: {
    title: 'Credits',
    art: 'Grafiken',
    artText: `Alle Grafiken in ${GAME_NAME} sind eigene Arbeiten. Es wird kein fremdes 3D Modell, keine importierte Textur, kein Sprite und kein Icon Set verwendet. Kreaturen, Symbole und Logo sind für dieses Spiel gezeichnet.`,
    fonts: 'Schriften',
    sound: 'Musik',
    soundText: `Das Spiel hat keine Klangeffekte. Seine einzige Tonspur ist eine Schleife, die unter Creative Commons Zero in die Gemeinfreiheit gestellt wurde. CC0 verlangt nichts zurück, dieser Credit steht hier aus Respekt vor der Arbeit. Die Musik lässt sich im Menü stumm schalten.`,
    tools: 'Werkzeuge und Dienste',
    hosting: 'Hosting, Spielserver und Botschutz',
    mail: 'Zustellung der Nachrichten aus dem Kontaktformular',
    words: 'Filterung der Spitznamen',
    dev: 'Entwickler',
    devText: `${AUTHOR} - Konzept, Programmierung, Balancing und künstlerische Leitung.`,
  },
  pt: {
    title: 'Créditos',
    art: 'Visuais',
    artText: `Todos os visuais de ${GAME_NAME} são criações originais. Não se usa nenhum modelo 3D externo, nenhuma textura importada, nenhum sprite e nenhum conjunto de ícones. As criaturas, os ícones e o logótipo são desenhados para este jogo.`,
    fonts: 'Tipos de letra',
    sound: 'Música',
    soundText: `O jogo não tem efeitos sonoros. A sua única banda sonora é um ciclo colocado no domínio público sob licença Creative Commons Zero. A CC0 não exige nada em troca, este crédito é dado por respeito pelo trabalho. A música silencia-se a partir do menu.`,
    tools: 'Ferramentas e serviços',
    hosting: 'alojamento do jogo, servidores de partida e proteção anti robô',
    mail: 'entrega das mensagens do formulário de contacto',
    words: 'filtragem dos nomes',
    dev: 'Programador',
    devText: `${AUTHOR} - conceção, programação, equilíbrio e direção artística.`,
  },
  ru: {
    title: 'Титры',
    art: 'Графика',
    artText: `Вся графика ${GAME_NAME} нарисована с нуля. Не используется ни одна чужая 3D модель, ни одна импортированная текстура, ни один спрайт и ни один набор иконок. Существа, значки и логотип нарисованы для этой игры.`,
    fonts: 'Шрифты',
    sound: 'Музыка',
    soundText: `В игре нет звуковых эффектов. Единственный звук - это музыкальная петля, переданная в общественное достояние по лицензии Creative Commons Zero. CC0 ничего не требует взамен, эти титры даны из уважения к труду. Музыку можно выключить в меню.`,
    tools: 'Инструменты и службы',
    hosting: 'хостинг игры, игровые серверы и защита от ботов',
    mail: 'доставка сообщений из формы связи',
    words: 'фильтр никнеймов',
    dev: 'Разработчик',
    devText: `${AUTHOR} - замысел, программирование, баланс и художественное решение.`,
  },
  tr: {
    title: 'Jenerik',
    art: 'Görseller',
    artText: `${GAME_NAME} içindeki tüm görseller özgün çalışmadır. Hiçbir dış 3B model, içe aktarılmış doku, sprite veya simge seti kullanılmaz. Yaratıklar, simgeler ve logo bu oyun için çizildi.`,
    fonts: 'Yazı tipleri',
    sound: 'Müzik',
    soundText: `Oyunda ses efekti yoktur. Tek ses, Creative Commons Zero ile kamu malı yapılmış bir müzik döngüsüdür. CC0 karşılığında hiçbir şey istemez, bu jenerik emeğe saygıdan yazıldı. Müzik menüden kapatılabilir.`,
    tools: 'Araçlar ve hizmetler',
    hosting: 'oyun barındırma, maç sunucuları ve bot koruması',
    mail: 'iletişim formu mesajlarının iletimi',
    words: 'takma ad süzme',
    dev: 'Geliştirici',
    devText: `${AUTHOR} - tasarım, programlama, denge ve sanat yönetimi.`,
  },
}

function creditsPage(lang) {
  const w = CREDITS[lang] || CREDITS.en
  return {
    title: w.title,
    body: `
      <h4>1. ${w.art}</h4>
      <p>${w.artText}</p>
      <h4>2. ${w.fonts}</h4>
      <p>Fredoka - Milena Brandao, Hafontia - SIL Open Font License 1.1<br>
      Rubik - Hubert and Fischer, Meir Sadan, Cyreal - SIL Open Font License 1.1</p>
      <h4>3. ${w.sound}</h4>
      <p>${w.soundText}</p>
      <p>Zane Little Music - Flowerbed Fields, OpenGameArt - CC0 1.0</p>
      <h4>4. ${w.tools}</h4>
      <p>Three.js - MIT<br>
      Vite - MIT<br>
      Cloudflare - ${w.hosting}<br>
      Resend - ${w.mail}<br>
      LDNOOBW - ${w.words}</p>
      <h4>5. ${w.dev}</h4>
      <p>${w.devText}</p>`,
  }
}

const GUIDE = {
  fr: {
    title: 'Comment jouer ?',
    aim: 'But du jeu',
    aimText: `Vous commencez en Larve, la forme la plus faible de l'arène. Mangez les cristaux pour grandir, et à chaque palier le jeu vous laisse choisir votre forme suivante. Votre corps et votre arme changent avec elle. En mourant vous redevenez une Larve, et tout ce que vous aviez se répand au sol pour les autres.`,
    rules: 'Les règles',
    r1: `Déplacez-vous avec ZQSD ou les flèches, visez à la souris et tirez au clic gauche ou avec la barre d'espace. Sur écran tactile, le joystick de gauche déplace et le rouge vise et tire.`,
    r2: `L'arène est faite de trois anneaux. Plus vous allez vers le centre, plus les cristaux sont riches et les voisins dangereux.`,
    r3: `Les buissons vous cachent mais n'arrêtent pas les balles. Un tir envoyé dans un buisson le traverse et touche ce qui se trouve dedans.`,
    r4: `Chaque niveau donne un point à placer parmi huit compétences, et chaque nouvelle forme en donne deux de plus. La forme choisie est la vôtre jusqu'à la mort.`,
    r5: `En Free for all, chacun pour soi. En Teams, rouge contre bleu : tenez les zones jusqu'à ce que leur jauge se remplisse et toute l'équipe encore en vie est payée. N'entrez jamais dans la base adverse.`,
    tree: `Arbre d'évolution`,
    treeHint: `Choisissez une créature pour voir ce qu'elle fait.`,
  },

  en: {
    title: 'How to play?',
    aim: 'The goal',
    aimText: `You start as a Grub, the weakest shape in the arena. Eat the crystals to grow, and at every tier the game lets you choose your next shape. Your body and your weapon change with it. On death you drop back to a Grub, and everything you had scatters on the ground for the others.`,
    rules: 'The rules',
    r1: `Move with WASD or the arrow keys, aim with the mouse and fire with the left click or the space bar. On a touch screen the left stick moves and the red one aims and fires.`,
    r2: `The arena is made of three rings. The closer to the centre, the richer the crystals and the more dangerous the neighbours.`,
    r3: `Bushes hide you but do not stop bullets. A shot fired into a bush goes through and hits whatever stands inside.`,
    r4: `Every level gives one point to spend among eight skills, and every new shape gives two more. The shape you pick is yours until you die.`,
    r5: `In Free for all it is everyone for themselves. In Teams, red against blue: hold the zones until their meter fills and every living team mate is paid. Never walk into the enemy base.`,
    tree: 'The evolution tree',
    treeHint: 'Pick a creature to see what it does.',
  },

  es: {
    title: '¿Cómo jugar?',
    aim: 'Objetivo',
    aimText: `Empiezas como Larva, la forma más débil de la arena. Come los cristales para crecer y en cada nivel el juego te deja elegir tu siguiente forma. Tu cuerpo y tu arma cambian con ella. Al morir vuelves a ser una Larva y todo lo que tenías se esparce por el suelo para los demás.`,
    rules: 'Las reglas',
    r1: `Muévete con WASD o las flechas, apunta con el ratón y dispara con el clic izquierdo o la barra espaciadora. En pantalla táctil, la palanca izquierda mueve y la roja apunta y dispara.`,
    r2: `La arena está formada por tres anillos. Cuanto más cerca del centro, más ricos son los cristales y más peligrosos los vecinos.`,
    r3: `Los arbustos te esconden pero no detienen las balas. Un disparo lanzado a un arbusto lo atraviesa y alcanza a quien esté dentro.`,
    r4: `Cada nivel da un punto entre ocho habilidades, y cada forma nueva da dos más. La forma elegida es tuya hasta que mueras.`,
    r5: `En Free for all, todos contra todos. En Teams, rojo contra azul: mantén las zonas hasta que su medidor se llene y todo el equipo con vida cobra. Nunca entres en la base enemiga.`,
    tree: 'Árbol de evolución',
    treeHint: 'Elige una criatura para ver lo que hace.',
  },

  de: {
    title: 'Wie wird gespielt?',
    aim: 'Ziel des Spiels',
    aimText: `Du beginnst als Made, die schwächste Form der Arena. Friss die Kristalle, um zu wachsen, und auf jeder Stufe lässt dich das Spiel deine nächste Form wählen. Körper und Waffe ändern sich mit ihr. Beim Tod wirst du wieder zur Made, und alles, was du hattest, verteilt sich am Boden für die anderen.`,
    rules: 'Die Regeln',
    r1: `Bewege dich mit WASD oder den Pfeiltasten, ziele mit der Maus und schieße mit der linken Maustaste oder der Leertaste. Auf dem Touchscreen bewegt der linke Stick, der rote zielt und schießt.`,
    r2: `Die Arena besteht aus drei Ringen. Je näher an der Mitte, desto reicher die Kristalle und desto gefährlicher die Nachbarn.`,
    r3: `Büsche verstecken dich, halten aber keine Kugeln auf. Ein Schuss in einen Busch geht hindurch und trifft, was darin steht.`,
    r4: `Jede Stufe gibt einen Punkt unter acht Fähigkeiten, jede neue Form zwei weitere. Die gewählte Form bleibt bis zum Tod.`,
    r5: `Bei Free for all kämpft jeder gegen jeden. Bei Teams, Rot gegen Blau: haltet die Zonen, bis ihre Anzeige voll ist, dann wird jedes lebende Teammitglied ausgezahlt. Betritt nie die gegnerische Basis.`,
    tree: 'Entwicklungsbaum',
    treeHint: 'Wähle eine Kreatur, um zu sehen, was sie kann.',
  },

  pt: {
    title: 'Como jogar?',
    aim: 'Objetivo',
    aimText: `Começas como Larva, a forma mais fraca da arena. Come os cristais para crescer e, em cada patamar, o jogo deixa-te escolher a forma seguinte. O corpo e a arma mudam com ela. Ao morrer voltas a ser uma Larva e tudo o que tinhas espalha-se no chão para os outros.`,
    rules: 'As regras',
    r1: `Move-te com WASD ou as setas, aponta com o rato e dispara com o clique esquerdo ou a barra de espaços. No ecrã tátil, o manípulo esquerdo move e o vermelho aponta e dispara.`,
    r2: `A arena é feita de três anéis. Quanto mais perto do centro, mais ricos são os cristais e mais perigosos os vizinhos.`,
    r3: `Os arbustos escondem-te mas não param as balas. Um tiro enviado para um arbusto atravessa-o e acerta em quem estiver lá dentro.`,
    r4: `Cada nível dá um ponto entre oito perícias e cada forma nova dá mais dois. A forma escolhida é tua até morreres.`,
    r5: `No Free for all é cada um por si. No Teams, vermelho contra azul: aguenta as zonas até o medidor encher e toda a equipa viva é paga. Nunca entres na base inimiga.`,
    tree: 'Árvore de evolução',
    treeHint: 'Escolhe uma criatura para veres o que faz.',
  },

  ru: {
    title: 'Как играть?',
    aim: 'Цель игры',
    aimText: `Вы начинаете Личинкой, самой слабой формой на арене. Ешьте кристаллы, чтобы расти, и на каждой ступени игра даёт выбрать следующую форму. Вместе с ней меняются тело и оружие. После смерти вы снова становитесь Личинкой, а всё накопленное рассыпается по земле для остальных.`,
    rules: 'Правила',
    r1: `Двигайтесь на WASD или стрелках, целитесь мышью, стреляете левой кнопкой или пробелом. На сенсорном экране левый джойстик двигает, красный целится и стреляет.`,
    r2: `Арена состоит из трёх колец. Чем ближе к центру, тем богаче кристаллы и опаснее соседи.`,
    r3: `Кусты прячут вас, но не останавливают пули. Выстрел в куст проходит насквозь и попадает в того, кто там стоит.`,
    r4: `Каждый уровень даёт очко на одну из восьми характеристик, а каждая новая форма даёт ещё два. Выбранная форма остаётся с вами до самой смерти.`,
    r5: `В режиме Free for all все против всех. В режиме Teams красные против синих: удерживайте зоны, пока не заполнится их шкала, и награду получают все живые союзники. Никогда не заходите на вражескую базу.`,
    tree: 'Древо эволюции',
    treeHint: 'Выберите существо, чтобы узнать, что оно умеет.',
  },

  tr: {
    title: 'Nasıl oynanır?',
    aim: 'Oyunun amacı',
    aimText: `Arenanın en zayıf biçimi olan Kurtçuk olarak başlarsınız. Büyümek için kristalleri yiyin, her kademede oyun size bir sonraki biçimi seçtirir. Bedeniniz ve silahınız onunla birlikte değişir. Öldüğünüzde yeniden Kurtçuk olursunuz ve biriktirdiğiniz her şey diğerleri için yere saçılır.`,
    rules: 'Kurallar',
    r1: `WASD veya yön tuşlarıyla hareket edin, fareyle nişan alın, sol tık veya boşluk tuşuyla ateş edin. Dokunmatik ekranda sol çubuk hareket ettirir, kırmızı olan nişan alıp ateş eder.`,
    r2: `Arena üç halkadan oluşur. Merkeze yaklaştıkça kristaller zenginleşir, komşular tehlikeli olur.`,
    r3: `Çalılar sizi gizler ama mermileri durdurmaz. Çalıya giden bir atış içinden geçer ve orada durana isabet eder.`,
    r4: `Her seviye sekiz yetenekten birine bir puan verir, her yeni biçim iki puan daha verir. Seçtiğiniz biçim ölene kadar sizindir.`,
    r5: `Free for all modunda herkes herkese karşıdır. Teams modunda kırmızıya karşı mavi: bölgeleri göstergeleri dolana kadar tutun, yaşayan tüm takım arkadaşlarınız ödül alır. Asla düşman üssüne girmeyin.`,
    tree: 'Evrim ağacı',
    treeHint: 'Ne yaptığını görmek için bir yaratık seçin.',
  },
}

function guidePage(lang) {
  const w = GUIDE[lang] || GUIDE.en
  return {
    title: w.title,
    body: `
      <h4>${w.aim}</h4>
      <p>${w.aimText}</p>
      <h4>${w.rules}</h4>
      <ul class="page-list">
        <li>${w.r1}</li>
        <li>${w.r2}</li>
        <li>${w.r3}</li>
        <li>${w.r4}</li>
        <li>${w.r5}</li>
      </ul>
      <h4>${w.tree}</h4>
      <p class="page-hint">${w.treeHint}</p>`,
  }
}

export function legalPage(lang, kind) {
  if (kind === 'guide') return guidePage(lang)
  if (kind === 'credits') return creditsPage(lang)
  const pack = LEGAL[lang] || LEGAL.en
  return pack[kind] || LEGAL.en[kind]
}
