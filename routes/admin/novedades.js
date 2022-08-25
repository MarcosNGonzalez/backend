var express = require('express');
var router = express.Router();
var novedadesModel = require('../../models/novedadesModel');
const util = require('util');
const cloudinary = require('cloudinary').v2;
const uploader = util.promisify(cloudinary.uploader.upload);
const destroy = util.promisify(cloudinary.uploader.destroy);

/* GET home page. */
router.get('/', async function(req, res, next) {

  var novedades = await novedadesModel.getNovedades();

  novedades = novedades.map(novedad => {
    if(novedad.img_id){
      const imagen = cloudinary.image(novedad.img_id,{
        width: 60,
        height: 60,
        crop: 'fill'
      });
      return{
        ...novedad,
        imagen
      }
    }else{
      return{
        ...novedad,
        imagen: ''
      }
    }
  });


  res.render('admin/novedades', {
    layout: 'admin/layout',
    persona: req.session.nombre,
    novedades,
  });
});

router.get('/agregar', (req, res, next) => {


  res.render('admin/agregar', {
    layout: 'admin/layout',
  });
});


router.post('/agregar', async(req, res, next) => {
  try {

    var img_id= '';
    if(req.files && Object.keys(req.files).length > 0){
      imagen = req.files.imagen;
      img_id = (await uploader(imagen.tempFilePath)).public_id;
    }


    if (req.body.titulo != "" && req.body.subtitulo != "" && req.body.cuerpo != "") {
      await novedadesModel.insertNovedad({
        ...req.body,
        img_id
      });
      res.redirect('/admin/novedades')
    } else {
      res.render('admin/agregar', {
        layout: 'admin/layout',
        error: true,
        message: 'Completar todos los campos !!!'
      })
    }
  } catch (error){
    console.log(error)
    res.render('admin/agregar', {
      layout: 'admin/layout',
        error: true,
        message: 'Error al cargar la novedad'
    })
  }
});

router.get('/eliminar/:id', async (req, res, next) => {
  var id = req.params.id;

  let novedad = await novedadesModel.getNovedadById(id);
  if(novedad.img_id) {
    await(destroy(novedad.img_id));
   }


  await novedadesModel.deleteNovedadesById(id);
  res.redirect('/admin/novedades');

});



router.get('/modificar/:id', async (req, res, next) => {
  var id = req.params.id;
  var novedad = await novedadesModel.getNovedadById(id);

  res.render('admin/modificar', {
    layout: 'admin/layout',
    novedad
  })
});



router.post('/modificar', async (req, res, next) => {
  try{

        let img_id = req.body.img_original;
        let borrar_img_anterior = false;
        if(req.body.img_delete === "1") {
          img_id = null;
          borrar_img_anterior = true;
        } else {
           if (req.files && Object.keys(req.files).length > 0) {
            imagen = req.files.imagen;
            img_id = (await uploader(imagen.tempFilePath)).public_id;
            borrar_img_anterior = true;
           }
        }
        if (borrar_img_anterior && req.body.img_original){
          await (destroy(req.body.img_original));
        } 






    var obj = {
      titulo: req.body.titulo,
      subtitulo: req.body.subtitulo,
      cuerpo: req.body.cuerpo,
      img_id
    }
  
    
    await novedadesModel.modificarNovedadById(obj, req.body.id);
    res.redirect('/admin/novedades');

  } catch (error) {
    console.log(error)
    res.render('admin/modificar', { 
      layout: 'admin/layput',
      error: true,
      message: 'No se llegó a modificar la novedad'

    })
  }
})






module.exports = router;