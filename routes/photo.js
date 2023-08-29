const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");

const router = express.Router();
// Import de modèles
const path = require("path");
const fs = require("fs");

// Fichier de l'arborescence des critères de recherche
const criterias = require("../assets/files/criterias.json");

// --------------------------------------------------------------------------
// Liste des photos
// --------------------------------------------------------------------------
router.get("/photos", async (req, res) => {
  console.log("Photos ...");

  try {
    const photosBis = [];

    //joining path of directory
    const directoryPath = path.join(__dirname + "/../temp", "");
    console.log("directoryPath -> ", directoryPath);

    //passsing directoryPath and callback function
    files = fs.readdirSync(directoryPath);

    //listing all files using forEach
    files.forEach(function (file) {
      //console.log("lecture fichier -> ", file);
      stats = fs.statSync(directoryPath + "/" + file);
      if (stats.isFile() && file[0] !== ".") {
        //console.log("fichier retenu -> ", file);

        photosBis.push({
          file: file,
          size: stats.size,
          date: stats.ctime,
        });
      }
    });

    //console.log("photosBis -> ", photosBis);

    res.status(200).json(photosBis);
  } catch (error) {
    console.log("Erreur détectée ->> ", error.message);
    res.status(400).json({ message: error.message });
  }
});

// --------------------------------------------------------------------------
// Réception de la sélection dans le formulaire et renvoi des critères
// --------------------------------------------------------------------------
router.put("/criterias-update", async (req, res) => {
  const { arrayForm, arrayCheck } = req.body;
  console.log("-----------------------------------------------");
  console.log("criterias-update ... ");
  //console.log("criterias-update ", arrayForm.length, arrayForm);

  try {
    const criteriasToDisplay = [];

    let columnNumber = 1;
    let childVisibility = true;
    let hideOverLevel = 99;
    let elemForm = [];

    criterias.map((elemMain, index) => {
      elemForm = arrayForm.filter((elem) => elem.nodeId === elemMain.nodeId);

      if (elemForm.length > 0) {
        //console.log("On recherche nodeId dans tableau elemForm : ", elemForm);
        // On recherche la situation dans le tableau issu du HTML
        if (elemForm.length > 0) {
          childVisibility = elemForm[0].childVisibility;
          columnNumber = elemForm[0].columnNumber;
          //console.log("élément elemForm  trouvé : ", childVisibility);
        }
      } else {
        childVisibility = elemMain.childVisibility;
        columnNumber = elemMain.columnNumber;
        //console.log("élément elemMain : ", childVisibility);
      }
      //console.log("columnNumber : ", columnNumber);

      if (columnNumber > hideOverLevel) {
        //console.log("On passe ce noeud : ", elemMain.nodeName);
      } else {
        criteriasToDisplay.push({
          nodeId: elemMain.nodeId,
          nodeName: elemMain.nodeName,
          columnNumber: elemMain.columnNumber,
          lineNumber: elemMain.lineNumber,
          nodeType: elemMain.nodeType,
          childVisibility: childVisibility,
          isSelected: arrayCheck.includes(elemMain.nodeId),
        });

        if (!childVisibility && elemMain.nodeType !== "VALUE") {
          hideOverLevel = columnNumber;
        } else {
          hideOverLevel = 99;
        }
      }
    });
    //console.log(criteriasToDisplay);
    res.status(200).json(criteriasToDisplay);
  } catch (error) {
    console.log("Erreur détectée ->> ", error.message);
    res.status(400).json({ message: error.message });
  }
});

// --------------------------------------------------------------------------
// Sauvegarde des photos ainsi que des critères de recherche associés aux photos
//
// TODO : gérer la modification.
//        - En cas de sauvegarde répétée pour les mêmes critères, les enregistrements
//          s'enregistrent dans le fichier photoCriterias.json.
//          Il faut avant chaque insertion vérifier si le noeud ( ou le searchPath ) existe pour le
//          fichier traité. Si oui, on remplace la valeur, sinon on ajoute un objet.
// --------------------------------------------------------------------------
router.put("/criterias-store", (req, res) => {
  const { arrayCheck, arrayTargetedFiles } = req.body;
  console.log("-----------------------------------------------");
  console.log("criterias-store...", req.body);

  try {
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

    // Lecture du fichier des critères
    const directoryFileCriterias = path.join(
      __dirname + "/../assets/files/criterias.json",
      ""
    );
    const dataCriterias = fs.readFileSync(directoryFileCriterias);
    let objCriterias = JSON.parse(dataCriterias);

    // Lecture du fichier critères par photo
    const dataPhotoCriterias = fs.readFileSync(directoryFilePhotoCriterias, {
      encoding: "utf8",
      flag: "r",
    });
    let objPhotoCriterias = JSON.parse(dataPhotoCriterias);

    // Boucle sur les fichiers photos à créer
    arrayTargetedFiles.map((file) => {
      //console.log("Fichier photo -> ", file);
      let found = false;
      for (let i = 0; i < objPhotos.length; i++) {
        if (objPhotos[i].originalName === file.file) {
          console.log("Fichier existant ! UPDATE !");
          found = true;
          break;
        }
      }
      if (!found) {
        console.log("Fichier inexistant ! APPEND !");
        objPhotos[objPhotos.length] = {
          originalName: file.file,
          name: file.file,
          size: file.size,
          dateFile: file.date,
          dateStorage: file.date,
        };
      }

      let lastSearchPath = "";
      arrayCheck.map((elem) => {
        //console.log("Elem -> ", elem);

        for (let i = 0; i < objCriterias.length; i++) {
          if (objCriterias[i].nodeType === "NODE") {
            lastSearchPath = objCriterias[i].searchPath;
          }
          console.log(
            "debug : ",
            i,
            lastSearchPath,
            objCriterias[i].nodeId,
            objCriterias[i].nodeName
          );
          if (elem === objCriterias[i].nodeId) {
            //console.log("Egalité !");
            objPhotoCriterias[objPhotoCriterias.length] = {
              name: file.file,
              searchPath:
                lastSearchPath +
                (objCriterias[i].nodeType === "VALUE"
                  ? " - " + objCriterias[i].nodeName
                  : null),
            };
            break;
          }
        }
      });
    });

    fs.writeFileSync(directoryFilePhotos, JSON.stringify(objPhotos));
    fs.writeFileSync(
      directoryFilePhotoCriterias,
      JSON.stringify(objPhotoCriterias)
    );

    res.status(200).json(criterias);
  } catch (error) {
    console.log("Erreur détectée ->> ", error.message);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
