import Alerte from "./Alerte.js";

class ModaleAction {
    #id;
    #displayName;
    #conteneurHTML;
    #btnAnnuler;
    #btnAction;
    #elToChange;
    #gabarit;
    #elementHTML;
    #action;
    #model;

    constructor(id, name, template, action, model, elToChange = null) {
        this.#id = id;
        this.#displayName = name;
        this.#action = action;
        this.#model = model;
        this.#elToChange = elToChange;
        this.#conteneurHTML = document.querySelector("main");
        this.#gabarit = document.querySelector(`[id='${template}']`);

        if (!this.#gabarit) {
            console.error(`Template with ID '${template}' not found.`);
            return;
        }

        this.#elementHTML;
        this.#afficher();
    }

    /**
     * Méthode privée pour afficher la modale
     */
    #afficher() {
        let modale = this.#gabarit.content.cloneNode(true);
        modale.querySelector("[data-js-replace='nom']").textContent =
            this.#displayName;

        this.#conteneurHTML.prepend(modale);
        this.#elementHTML = this.#conteneurHTML.firstElementChild;

        this.#btnAnnuler = this.#elementHTML.querySelector(
            "[data-js-action='annuler']"
        );

        if (this.#btnAnnuler) {
            this.#btnAnnuler.addEventListener(
                "click",
                this.#fermerModale.bind(this)
            );
        }

        this.#btnAction = this.#elementHTML.querySelector(
            "[data-js-action='" + this.#action + "']"
        );

        if (this.#btnAction) {
            if (this.#action === "supprimer") {
                this.#btnAction.addEventListener(
                    "click",
                    this.#supprimer.bind(this)
                );
            } else if (this.#action === "deconnexion") {
                this.#btnAction.addEventListener(
                    "click",
                    this.#deconnexion.bind(this)
                );
            }
        }

        // Vérifiez si des éléments existent avant d’appliquer des classes
        const mainElement = document.querySelector("main");
        const footerDiv = document.querySelector("footer > div");

        if (mainElement) {
            mainElement.classList.add("action-locked");
        }
        if (footerDiv) {
            footerDiv.classList.add("action-locked");
        }
    }

    /**
     * Méthode privée pour fermer la modale
     */
    #fermerModale() {
        const mainElement = document.querySelector("main");
        const footerDiv = document.querySelector("footer > div");

        if (mainElement) {
            mainElement.classList.remove("action-locked");
        }
        if (footerDiv) {
            footerDiv.classList.remove("action-locked");
        }

        if (this.#elementHTML) {
            this.#elementHTML.classList.add("remove");

            setTimeout(() => {
                this.#elementHTML.remove();
            }, 2650);
        }
    }

    /**
     * Méthode privée pour supprimer
     */
    async #supprimer() {
        const response = await fetch(
            `/api/${this.#action}/${this.#model}/${this.#id}`,
            {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        const top = document.querySelector("[data-js='header']");

        if (response.ok) {
            const message =
                this.#model === "cellier"
                    ? "Cellier supprimé avec succès"
                    : "Utilisateur supprimé avec succès";
            this.#elToChange?.remove();

            this.#elementHTML.remove();
            top.scrollIntoView();
            new Alerte(null, message, "succes");
        } else {
            const message =
                this.#model === "cellier"
                    ? "Erreur à la suppression du cellier"
                    : "Erreur à la suppression de l'utilisateur";
            this.#elementHTML.remove();
            top.scrollIntoView();
            new Alerte(null, message, "erreur");
        }
    }

    /**
     * Méthode privée pour déconnexion
     */
    #deconnexion() {
        // Envoyer le formulaire de déconnexion masquée
        const logoutForm = document.getElementById("logout-form");
        if (logoutForm) {
            logoutForm.submit();
        } else {
            console.error("Logout form not found.");
        }

        this.#fermerModale();
    }
}

export default ModaleAction;
