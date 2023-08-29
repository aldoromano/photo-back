const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");

const router = express.Router();
// Import de modèles
const Node = require("../models/Node");
const Link = require("../models/Link");
var ObjectId = require("mongoose").Types.ObjectId;

//const _ = require("lodash");
router.post("/node", async (req, res) => {
  console.log("/node ...", req.body);

  try {
    const { arrayNode } = req.body;

    // Suppression préalable de tous les liens
    Node.deleteMany({})
      .then(function () {
        console.log("Data deleted"); // Success
      })
      .catch(function (error) {
        console.log(error); // Failure
      });

    for (let i = 0; i < arrayNode.length; i++) {
      const node = new Node({
        name: arrayNode[i].name,
        shortName: arrayNode[i].shortName,
      });
      await node.save();
    }

    res.status(200).json({ message: "Succès..." });
  } catch (error) {
    console.log("Erreur détectée ->> ", error.message);
    res.status(400).json({ message: error.message });
  }
});

router.post("/link", async (req, res) => {
  console.log("/link ...", req.body);

  try {
    const { arrayLink } = req.body;

    // Suppression préalable de tous les liens
    Link.deleteMany({})
      .then(function () {
        console.log("Data deleted"); // Success
      })
      .catch(function (error) {
        console.log(error); // Failure
      });

    // Lecture du tableau des liens à ajouter
    let counter = 0;
    let shortName = "";

    for (let i = 0; i < arrayLink.length; i++) {
      const parent = await Node.findOne({
        shortName: arrayLink[i].parentShort,
      });
      const child = await Node.findOne({ shortName: arrayLink[i].childShort });

      console.log("id parent : ", parent._id, parent._id.toString());
      const parentLink = Link.findOne({ nodeIdChild: parent._id.toString() });

      if (!parentLink.shortName) {
        console.log("Pas de lien parent trouvé !");
        shortName = child.shortName;
      } else {
        shortName = parentLink.shortName + " - " + child.shortName;
      }

      console.log("shortName : ", shortName);
      const link = new Link({
        nodeIdParent: parent._id,
        nodeIdChild: child._id,
        shortName: shortName,
      });

      // console.log("link : ", link);
      await link.save();
      counter++;
    }
    res.status(200).json({ message: "Succès... " + counter + " liens créés" });
  } catch (error) {
    console.log("Erreur détectée ->> ", error.message);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
