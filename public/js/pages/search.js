import App from "../components/App.js";
import Bottle from "../components/Bottle.js";

(async function () {
    new App();

    //remontrer en haut de la page
    const btnRemonter = document.querySelector('[data-js="remonter"]');
    btnRemonter.addEventListener("click", function () {
        const top = document.querySelector(".search-header");
        top.scrollIntoView();
    });

    let loading = false;
    let currentPage = 1;
    let maxPage = 1;

    // conteneur pour la recherche et les suggestions de recherche
    const resultContainer = document.querySelector("[data-js-list]");
    const suggestionsContainer = document.querySelector(".search_suggestions");
    const searchInput = document.querySelector("#search");

    const barCodeScannerButton = document.querySelector(
        "[data-js-action='scanner']"
    );

    const searchForm = document.querySelector(".search");
    searchForm.addEventListener("submit", function (event) {
        event.preventDefault();
        currentPage = 1;
        loadData(currentPage);
    });

    // pour autocomplete & scanner
    document.addEventListener("DOMContentLoaded", function () {
        if (!searchInput || !suggestionsContainer) {
            console.error(
                "L'élément #search ou .search_suggestions est introuvable !"
            );
            return;
        }

        // Récupérer la source actuelle de l'URL ou depuis sessionStorage
        const urlParams = new URLSearchParams(window.location.search);
        let source = urlParams.get("source");

        if (!source) {
            // Si aucune source dans l'URL, essayez de récupérer depuis sessionStorage
            source = sessionStorage.getItem("source") || "default";
        } else {
            // Si une source existe dans l'URL, la sauvegarder dans sessionStorage
            sessionStorage.setItem("source", source);
        }

        // Lancer le scanner au click en utilisant la camera de l'utilisateur
        barCodeScannerButton.addEventListener("click", function () {
            console.log("Scanner button clicked");
            // Selection de l'emplacement du scanner
            const scannerContainer = document.querySelector(
                "template#interactive-container"
            );
            const scannerContent = scannerContainer.content.cloneNode(true);
            document.querySelector("main > section").append(scannerContent);

            Quagga.init(
                {
                    inputStream: {
                        name: "Live",
                        type: "LiveStream",
                        target: document.querySelector("#interactive"),
                        constraints: {
                            width: { min: 640 },
                            height: { min: 480 },
                            facingMode: "environment",
                        },
                    },
                    decoder: {
                        readers: [
                            "code_128_reader",
                            "ean_reader",
                            "upc_reader",
                        ],
                    },
                },
                function (err) {
                    if (err) {
                        console.error("Error initializing Quagga:", err);
                        return;
                    }
                    console.log("Quagga initialized.");
                    Quagga.start();
                }
            );

            // Écouteur d'évènement pour la détection d'un barcode
            Quagga.onDetected((data) => {
                console.log("Barcode detected:", data.codeResult.code);
                const url = `/recherche?query=${encodeURIComponent(
                    data.codeResult.code
                )}&source=${encodeURIComponent(source)}`;
                window.location.href = url;

                Quagga.stop();
                scannerContent.innerHTML = "";
            });
        });

        searchInput.addEventListener("input", function () {
            const query = searchInput.value.trim();

            if (query.length < 2) {
                suggestionsContainer.innerHTML = "";
                suggestionsContainer.style.display = "none";
            }

            // Récupérer la source actuelle de l'URL ou depuis sessionStorage
            const urlParams = new URLSearchParams(window.location.search);
            let source = urlParams.get("source");

            if (!source) {
                // Si aucune source dans l'URL, essayez de récupérer depuis sessionStorage
                source = sessionStorage.getItem("source") || "default";
            } else {
                // Si une source existe dans l'URL, la sauvegarder dans sessionStorage
                sessionStorage.setItem("source", source);
            }

            searchInput.addEventListener("input", function () {
                const query = searchInput.value.trim();

                if (query.length < 2) {
                    suggestionsContainer.innerHTML = "";
                    suggestionsContainer.style.display = "none";
                    return;
                }

                fetch(
                    `/recherche-autocomplete?query=${encodeURIComponent(query)}`
                )
                    .then((response) => response.json())
                    .then((data) => {
                        suggestionsContainer.innerHTML = "";

                        if (data.length === 0) {
                            // Afficher un message d'absence de résultats (optionnel)
                            const noResultMessage =
                                document.createElement("li");
                            noResultMessage.textContent =
                                "Aucun résultat trouvé.";
                            noResultMessage.classList.add("suggestion-item");
                            suggestionsContainer.appendChild(noResultMessage);
                            suggestionsContainer.style.display = "block";
                            return;
                        }

                        data.forEach((item) => {
                            const suggestion = document.createElement("li");
                            suggestion.textContent = `${item.name} (${item.type}, ${item.country})`;
                            suggestion.classList.add("search_suggestion-item");

                            suggestion.addEventListener(
                                "click",
                                function (event) {
                                    event.preventDefault();
                                    searchInput.value = item.name;
                                    suggestionsContainer.style.display = "none";
                                    resultContainer.focus();
                                    currentPage = 1;
                                    loadData(currentPage);
                                }
                            );

                            suggestionsContainer.appendChild(suggestion);
                        });

                        suggestionsContainer.style.display = "block";
                    })
                    .catch((error) => {
                        console.error(
                            "Erreur lors de la récupération des suggestions :",
                            error
                        );
                    });
            });
        });
    });

    // --- filtres ---
    const filterFormHTML = document.querySelector("[data-js='filtersForm']");

    //calcul de la hauteur du footer pour la position du filtre
    const footerHTML = document.querySelector(".nav-menu");
    const footerHeight = footerHTML.offsetHeight;
    filterFormHTML.style.setProperty("--bottom", `${footerHeight}px`);
    const btnFilters = document.querySelector("#btn-filters");
    const btnFilterY = App.instance.getAbsoluteYPosition(btnFilters);
    filterFormHTML.style.setProperty("--top", `${btnFilterY}px`);

    // changer l'ordre d'affichage selon la selection

    const sortingOptions = document.querySelectorAll("[name='sorting']");
    sortingOptions.forEach(function (option) {
        option.addEventListener("change", function () {
            const selectedSort = document.querySelector(
                "[name='sorting']:checked"
            );
            if (selectedSort) {
				const sortOrder = selectedSort.value;
				currentPage = 1;
				renderSort(sortOrder);
            }
        });
    });

    //reinitialisation des filtres
    const btnResetFilters = filterFormHTML.querySelector(
        "[data-js='resetFilters']"
    );
    btnResetFilters.addEventListener("click", function (event) {
        event.preventDefault();
        filterFormHTML.reset();
    });

    //  ---- fonctions auxilières ----
    /**
     * charge et affiche les résultats
     */
    async function loadData(page = 1) {
        // Prevent loading if there's an ongoing request
        if (loading) return;
        loading = true; // Set loading to true

        // recupérer les données et afficher
        try {
            const searchQuery = document.querySelector("#search").value;

            let formData = new FormData();
            formData.append("query", searchQuery);

            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                .getAttribute("content");
            const response = await fetch(
                `${App.instance.baseURL}/api/recherche?page=${page}`,
                {
                    method: "post",
                    body: formData,
                    headers: {
                        "X-CSRF-TOKEN": csrfToken, // Ajoute CSRF token
                        Authorization:
                            "Bearer " + localStorage.getItem("token"), // Ajoute le token
                    },
                }
            );

            const data = await response.json();

            // //TODO: render
            const nbResults = document.createElement("p");
            if (data.results.total === 0) {
                nbResults.textContent = "0 rétulat trouvé";
            } else if (data.results.total === 1) {
                nbResults.textContent = `${data.results.total} résultat trouvé`;
            } else {
                nbResults.textContent = `${data.results.total} résultats trouvés`;
            }
            const existingResults = resultContainer.querySelector("p");

            if (page === 1) {
                resultContainer.innerHTML = "";
                existingResults.remove();
                resultContainer.append(nbResults);
            }

            const template = document.querySelector(
                "template#searchResultBottle"
            );

            data.results.data.forEach(
                (bottle) =>
                    new Bottle(
                        bottle,
                        "search",
                        template,
                        resultContainer,
                        data.source
                    )
            );
            maxPage = data.results.last_page;

            // ajouter bouton afficher plus si pas derniere page
            if (page < maxPage) {
                const btnAfficherPlus = document.createElement("button");
                btnAfficherPlus.textContent = "Afficher plus";
                btnAfficherPlus.classList.add("btn");
                btnAfficherPlus.classList.add("btn_outline_dark");
                btnAfficherPlus.dataset.js = "afficherPlusBouteille";

                resultContainer.append(btnAfficherPlus);
                const btnAfficherPlusHtml = resultContainer.lastElementChild;

                btnAfficherPlusHtml.addEventListener("click", function (event) {
                    const existingBtnAfficherPlus = event.target;
                    existingBtnAfficherPlus.remove();
                    loadData(currentPage);
                });
            }

            const heading = document.querySelector(".search-header");
            heading.textContent = `Résultat pour "${searchQuery}"`;

            suggestionsContainer.style.display = "none";

            currentPage++;
            loading = false;
        } catch (error) {
            console.log(error);
            loading = false;
        }
    }

    /**
     * trier et afficher
     */
    async function renderSort(sortOrder, page = 1) {
        // Prevent loading if there's an ongoing request
        if (loading) return;
        loading = true; // Set loading to true

        // recupérer les données et afficher
        try {
			console.log(page);
            const searchQuery = document.querySelector("#search").value;

            let formData = new FormData();
            formData.append("query", searchQuery);

            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                .getAttribute("content");
            const response = await fetch(
                `${App.instance.baseURL}/api/recherche?page=${page}&tri=${sortOrder}`,
                {
                    method: "post",
                    body: formData,
                    headers: {
                        "X-CSRF-TOKEN": csrfToken, // Ajoute CSRF token
                        Authorization:
                            "Bearer " + localStorage.getItem("token"), // Ajoute le token
                    },
                }
            );

            const data = await response.json();

            // //TODO: render
            const nbResults = document.createElement("p");
            if (data.results.total === 0) {
                nbResults.textContent = "0 rétulat trouvé";
            } else if (data.results.total === 1) {
                nbResults.textContent = `${data.results.total} résultat trouvé`;
            } else {
                nbResults.textContent = `${data.results.total} résultats trouvés`;
            }
            const existingResults = resultContainer.querySelector("p");

            if (page === 1) {
                resultContainer.innerHTML = "";
                existingResults.remove();
                resultContainer.append(nbResults);
            }

            const template = document.querySelector(
                "template#searchResultBottle"
            );

            data.results.data.forEach(
                (bottle) =>
                    new Bottle(
                        bottle,
                        "search",
                        template,
                        resultContainer,
                        data.source
                    )
            );
            maxPage = data.results.last_page;

            // ajouter bouton afficher plus si pas derniere page
            if (page < maxPage) {
                const btnAfficherPlus = document.createElement("button");
                btnAfficherPlus.textContent = "Afficher plus";
                btnAfficherPlus.classList.add("btn");
                btnAfficherPlus.classList.add("btn_outline_dark");
                btnAfficherPlus.dataset.js = "afficherPlusBouteille";

                resultContainer.append(btnAfficherPlus);
                const btnAfficherPlusHtml = resultContainer.lastElementChild;

                btnAfficherPlusHtml.addEventListener("click", function (event) {
                    const existingBtnAfficherPlus = event.target;
                    existingBtnAfficherPlus.remove();
                    renderSort(sortOrder, currentPage);
                });
            }

            const heading = document.querySelector(".search-header");
            heading.textContent = `Résultat pour "${searchQuery}"`;

            suggestionsContainer.style.display = "none";

            currentPage++;
            loading = false;
        } catch (error) {
            console.log(error);
            loading = false;
        }
    }
})();
