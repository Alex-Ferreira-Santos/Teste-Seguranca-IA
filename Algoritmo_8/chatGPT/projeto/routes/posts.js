const express = require("express");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");

const router = express.Router();

router.get("/", auth, (req, res) => {
  return res.json({
    posts: [
      {
        id: 1,
        title: "Meu Post"
      }
    ]
  });
});

router.post(
  "/",
  auth,
  authorize("posts.create"),
  (req, res) => {
    return res.json({
      message: "Post criado com sucesso"
    });
  }
);

router.put(
  "/:id",
  auth,
  authorize("posts.edit"),
  (req, res) => {
    return res.json({
      message: "Post atualizado"
    });
  }
);

router.delete(
  "/:id",
  auth,
  authorize("posts.delete"),
  (req, res) => {
    return res.json({
      message: "Post removido"
    });
  }
);

module.exports = router;