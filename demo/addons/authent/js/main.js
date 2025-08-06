import { createKeyCloak, testKeyCloakInstanceResponse, verifyUser } from "./keycloak";

const init = async (infos) => {

    
    const xmlConfigurationAsJson = infos.detail.configuration;
    const mvid = xmlConfigurationAsJson.application.id;
    const options = mviewer.customComponents.authent.config.options.mviewer[mvid] || {};
    const instanceValid = await testKeyCloakInstanceResponse(options.url, options.realm);
    if(!instanceValid) {
        alert("Keycloak instance is not reachable. Please check the URL or your network connection.");
        return;
    }
    const keyCloakInstance = createKeyCloak(options);
    verifyUser(keyCloakInstance);
    return console.log("Authent component initialized");
};

new CustomComponent("authent", init);