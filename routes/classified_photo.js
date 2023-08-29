const express = require("express");
const axios = require("axios");
const router = require("./node");

const path = require("path");
const fs = require("fs");

// Fichier de l'arborescence des critères de recherche
const criterias = require("../assets/files/criterias.json");
/***************************************************************************
 * Reste à faire : accepter recherche vide -> Afficher tous les fichiers
 *
 * Supprimer les fichiers photos en double en fin de fonction
 *
 * */
router.put("/classified-photo", (req, res) => {
  console.log("classified-photo ...", req.body);

  try {
    const { arrayCheck } = req.body;

    // Fichier photos
    const directoryFilePhotos = path.join(
      __dirname + "/../assets/files/photos.json",
      ""
    );

    // Fichier critères / photo
    const directoryFilePhotoCriterias = path.join(
      __dirname + "/../assets/files/photoCriterias.json",
      ""
    );

    // Lecture du fichier photos
    const dataPhotos = fs.readFileSync(directoryFilePhotos, {
      encoding: "utf8",
      flag: "r",
    });
    let objPhotos = JSON.parse(dataPhotos);

    // Lecture du fichier critères par photo
    const dataPhotoCriterias = fs.readFileSync(directoryFilePhotoCriterias, {
      encoding: "utf8",
      flag: "r",
    });
    let objPhotoCriterias = JSON.parse(dataPhotoCriterias);
    console.log("objPhotoCriterias -> ", objPhotoCriterias);

    const tblSearchPath = []; // Le tableau final des searchPath
    const tblParentSearch = []; // Le tableau des parents de chaque critère de recherche

    let lastSearchPath = ""; // Dernier Node ID lu

    // Lecture des Node ID sélectionnés depuis l'IHM
    arrayCheck.map((nodeId) => {
      // Boucle sur le fichier des critères : on ne
      criterias.map((criteria) => {
        if (criteria.nodeType === "NODE") {
          lastSearchPath = criteria.searchPath;
        }

        if (criteria.nodeId === nodeId) {
          // On mémorise si ça n'est pas déjà fait le parent du critère de recherche
          tblParentSearch.includes(lastSearchPath)
            ? null
            : tblParentSearch.push(lastSearchPath);

          // On formate le searchPath selon que l'on soit sur un noeud ou une valeur
          if (criteria.nodeType == "VALUE") {
            tblSearchPath.push(lastSearchPath + " - " + criteria.nodeName);
          } else {
            tblSearchPath.push(criteria.searchPath);
          }
        }
      });
    });
    console.log("SearchPath trouvés -> ", tblSearchPath);

    // On sélectionne les fichiers en fonction des searchPath trouvé dans le fichier des liens
    // entre photos et critères
    tblFilesSelected = objPhotoCriterias.filter((elem) => {
      let found = false;
      for (i = 0; i < tblSearchPath.length; i++) {
        if (elem.searchPath.includes(tblSearchPath[i])) {
          found = true;
          break;
        }
      }
      return found;
    });

    // On récupère les noms de fichiers ayant des critères de sélection qui matchent
    const tblFilesRawSelection = [
      ...new Set(tblFilesSelected.map((item) => item.name)),
    ];

    console.log(
      "tblFiles.... -> ",
      tblFilesSelected,
      " / ",
      tblFilesRawSelection
    );

    // On filtre les fichiers qui ont tous les critères renseignés
    const tblFilesFinalSelection = tblFilesRawSelection.filter((elem) => {
      console.log("Boucle final selection : ", elem);
      let ok = 0;
      for (i = 0; i < tblParentSearch.length; i++) {
        console.log("  Boucle parent : ", tblParentSearch[i]);
        for (j = 0; j < tblFilesSelected.length; j++) {
          if (tblFilesSelected[j].name !== elem) continue;

          console.log("éléments -> ", tblFilesSelected[j].searchPath, " - ", j);
          if (tblFilesSelected[j].searchPath.includes(tblParentSearch[i])) {
            ok++;
            break;
          }
        }
      }
      console.log(" ko -> ", ok);
      return ok === tblParentSearch.length;
    });

    console.log(
      "tblFilesFinalSelection -> ",
      tblFilesFinalSelection,
      " / pour : ",
      tblParentSearch
    );

    console.log("tblFilesSelected -> ", tblFilesSelected);

    // Finalement on sélectionne les fichiers photos
    filesToReturn = objPhotos.filter((elem) => {
      return arrayCheck.length
        ? tblFilesFinalSelection.includes(elem.name)
        : true;
    });

    console.log(
      "Fichiers correspondants aux critères -> ",
      filesToReturn,
      " - ",
      arrayCheck.length
    );
    res.status(200).json(filesToReturn);
  } catch (error) {
    console.log("Erreur détectée ->> ", error.message);
    res.status(400).json({ message: error.message });
  }
});

/***************************************************
 * Archivage des photos dans le répertoire permanent
 ***************************************************/

router.put("/archive", (req, res) => {
  console.log("archive ...", req.body);
  const { arrayFile } = req.body;

  try {
    // Répertoire temporaire
    const directoryTemp = path.join(__dirname + "/../temp", "");

    // Répertoire d'archive
    const directoryArchive = path.join(__dirname + "/../archive", "");

    // Boucle sur les fichiers
    arrayFile.map((elem) => {
      console.log(elem.file);

      // Copie du fichier dans le répertoire permanent
      fs.copyFileSync(
        directoryTemp + "/" + elem.file,
        directoryArchive + "/" + elem.file
      );

      // Suppression dans le répertoire temporaire
      fs.unlinkSync(directoryTemp + "/" + elem.file);
    });
  } catch (error) {
    console.log("Erreur détectée ->> ", error.message);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
