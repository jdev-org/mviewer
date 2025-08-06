const defaultKeycloakConfig = {
    url: "",
    clientId: "",
    realm: "",
    activate: false
}
export const verifyUser = (keycloakInstance) => {
  keycloakInstance
    .init({ onLoad: "login-required" })
    .then((authenticated) => {
      if (authenticated) {
        console.log("Connecté avec Keycloak");

        $(document).trigger("token-ready", keycloakInstance.token);

        window.history.replaceState(
          null,
          document.title,
          window.location.pathname + window.location.search
        );

        // Injecter le token dans les appels XHR (si tu as besoin pour GeoServer, API, etc.)
        //   $.ajaxSetup({
        //     beforeSend: function (xhr, settings) {
        //       const url = settings.url || "";

        //       const needsAuth = url.includes("/api/") || url.includes("/geoserver/ows");

        //       if (needsAuth && instance?.token) {
        //         xhr.setRequestHeader("Authorization", "Bearer " + instance.token);
        //       }
        //     },
        //   });

        // Lancer le chargement normal de l'application
        // loadApplication();
      } else {
        alert("Authentification requise");
      }
    })
    .catch((error) => {
      console.error("Erreur d'initialisation Keycloak :", error);
      alert("Erreur d'authentification.");
    });
};
export const createKeyCloak = (config = defaultKeycloakConfig) => {
  let { url, type, enabled, realm, clientid } = config;
  if (enabled && type === "keycloak" && clientid && realm && url) {
    const keycloakConfig = {
      url: url,
      clientId: clientid,
      realm: realm,
    };
    // Initialiser Keycloak uniquement si l'application est privée
    return Keycloak(keycloakConfig);
  } else {
    alert("Informations de Keycloak manquantes ou incorrectes.");
    return;
  }
};


export const testKeyCloakInstanceResponse = (url, realm) => {
    const urlRealm = `${url}/realms/${realm}/.well-known/openid-configuration`
    return fetch(urlRealm, { method: "GET", redirect: "follow" })
    .then(response => {
        if (response.ok) {
        console.log("Keycloak est accessible sur localhost:8081");
        } else {
        console.warn("Réponse reçue, mais erreur HTTP :", response.status);
        }
        return true;
    })
    .catch(error => {
        console.error("Keycloak n’est pas accessible :", error.message);
        return false;
    });
}