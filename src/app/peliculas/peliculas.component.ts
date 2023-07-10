import { Component, OnInit } from '@angular/core';
import axios from 'axios';
import { ViewChild, ElementRef } from '@angular/core';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-peliculas',
  templateUrl: './peliculas.component.html',
  styleUrls: ['./peliculas.component.css'],
})
export class PeliculasComponent implements OnInit {
  peliculas: any[] = [];
  busqueda: string = '';
  nuevoElenco: string = '';
  elenco: string[] = [];
  categorias: any[] = [];
  @ViewChild('anopublicInput', { static: false })
  anopublicInput!: ElementRef<HTMLInputElement>;
  categoriaSeleccionada: string = '';
  pelicula: any = {
    nombre: '',
    descripcion: '',
    urlpelicula: '',
    urlimagen: '',
    categoria: '',
    duracion: '',
    director: '',
    elenco: [],
  };
  peliculasFiltradas: any[] = [];

  anopublic: number | null = null;
  archivoPelicula: File | null = null;
  archivoImagen: File | null = null;

  constructor() {
    this.peliculas = []; // Inicializar el arreglo de películas vacío
  }

  ngOnInit(): void {
    this.cargarPeliculas();
    this.cargarCategorias();
    this.peliculasFiltradas = this.peliculas; // Cargar todas las películas sin filtrar inicialmente
  }
  
  onArchivoPeliculaChange(event: any) {
    this.archivoPelicula = event.target.files[0];
  }

  onArchivoImagenChange(event: any) {
    this.archivoImagen = event.target.files[0];
  }

  filtrarPorCategoria(categoriaId: string) {
    if (categoriaId === '') {
      this.peliculasFiltradas = this.peliculas;
    } else {
      this.peliculasFiltradas = this.peliculas.filter(pelicula => pelicula.categoria._id === categoriaId);
    }
  }
  
  
  
  cargarPeliculas() {
    axios
      .get('http://52.86.133.104/peliculas')
      .then((response) => {
        this.peliculas = response.data;
        this.peliculasFiltradas = response.data;
      })
      .catch((error) => {
        console.error('Error al cargar las películas:', error);
      });
  }
  agregarElenco() {
    if (
      this.nuevoElenco.trim() !== '' &&
      !this.elenco.includes(this.nuevoElenco)
    ) {
      this.elenco.push(this.nuevoElenco);
      this.nuevoElenco = '';
      console.log('NUEVO ELEMENTO: ' + this.nuevoElenco);
      console.log('LISTA: ' + JSON.stringify(this.elenco));
    }
  }
  eliminarActor(event: Event, nombre: string) {
    event.stopPropagation();
    const indice = this.elenco.indexOf(nombre);
    if (indice !== -1) {
      this.elenco.splice(indice, 1);
    }
  }

  onNuevoElencoChange(event: any) {
    const nuevoValor = event.target.value || '';
    this.nuevoElenco = nuevoValor;
    console.log('Valor actualizado de nuevoElenco:', this.nuevoElenco);
  }

  cargarCategorias() {
    axios
      .get('http://52.86.133.104/categorias')
      .then((response) => {
        this.categorias = response.data;
      })
      .catch((error) => {
        console.error('Error al cargar las categorías:', error);
      });
  }
  guardarPelicula() {
    console.log('Datos de la película:', this.pelicula);
    this.pelicula.añopublic = this.anopublic;
    this.pelicula.categoria = this.categoriaSeleccionada;
    this.pelicula.elenco = [...this.elenco];
    if (this.pelicula._id) {
      if (this.archivoPelicula && this.archivoImagen) {
        axios
        .get(`http://52.86.133.104/peliculas/${this.pelicula._id}`) // Obtener la película por su ID
        .then((response) => {
          const pelicula = response.data;
          const peliculaId = pelicula._id;
          const fileUrlPelicula = pelicula.urlpelicula;
          const fileUrlImagen = pelicula.urlimagen;
          if (fileUrlImagen) {
            axios
              .delete(`http://52.86.133.104/files/${encodeURIComponent(fileUrlImagen)}`) // Eliminar el archivo de la imagen
              .then(() => {
                axios
                  .delete(`http://52.86.133.104/files/${encodeURIComponent(fileUrlPelicula)}`) // Eliminar el archivo de la película
                  .then(() => {
                    if (this.archivoPelicula) {
                      const peliculaFormData = new FormData();
                        const config = {
                          headers: {
                            'Content-Type': this.archivoPelicula.type,
                            'Content-Disposition': 'inline'
                          },
                          
                        };
                        peliculaFormData.append('file', this.archivoPelicula, this.archivoPelicula.name);
                        peliculaFormData.append('Content-Type', this.archivoPelicula.type);
                        peliculaFormData.append('Content-Disposition', 'inline');
                        console.log('Content-Type:', this.archivoPelicula.type);
                        console.log('Content-Disposition:', 'inline');
                        axios
                          .post('http://52.86.133.104/files', peliculaFormData, config)
                          .then((peliculaFileResponse) => {
                            const peliculaFileName = this.archivoPelicula!.name;
                            const peliculaFileUrl = `https://multimediapfinal.s3.amazonaws.com/${peliculaFileName}`;
                            this.pelicula.urlpelicula = peliculaFileUrl;
                            if (this.archivoImagen) {
                              const imagenFormData = new FormData();
                                const config2 = {
                                  headers: {
                                    'Content-Type': this.archivoImagen.type,
                                    'Content-Disposition': 'inline'
                                  }
                                };
                                imagenFormData.append('file', this.archivoImagen, this.archivoImagen.name);
                                imagenFormData.append('Content-Type', this.archivoImagen.type);
                                imagenFormData.append('Content-Disposition', 'inline');
                                axios
                                .post('http://52.86.133.104/files', imagenFormData, config2)
                                .then((imagenFileResponse) => {
                                  const imagenFileName = this.archivoImagen!.name;
                                  const imagenFileUrl = `https://multimediapfinal.s3.amazonaws.com/${imagenFileName}`;
                                  this.pelicula.urlimagen = imagenFileUrl;
                                  axios
                                    .put(`http://52.86.133.104/peliculas/${this.pelicula._id}`, this.pelicula)
                                    .then((response) => {
                                      console.log('Película editada:', response.data);
                                      this.cargarPeliculas();
                                      this.resetFormulario();
                                      Swal.fire({
                                        title: 'Éxito',
                                        text: 'Registro editado satisfactoriamente',
                                        icon: 'success',
                                        confirmButtonText: 'Aceptar',
                                        customClass: {
                                          popup: 'netflix-alert',
                                          title: 'swal2-title',
                                          actions: 'swal2-actions',
                                          confirmButton: 'swal2-confirm',
                                          cancelButton: 'swal2-cancel'
                                        }
                                      }).then((result) => {
                                        
                                      }); 
                                    })
                                })
                            }
                          })
                    }
                    this.cargarPeliculas();

                  })
                  .catch((error) => {
                    console.error('Error al eliminar el archivo de la película:', error);
                  });
              })
              .catch((error) => {
                console.error('Error al eliminar el archivo de imagen:', error);
              });
          }
        })
        .catch((error) => {
          console.error('Error al obtener las peliculas:', error);
        });
      }if(this.archivoPelicula){
        axios
        .get(`http://52.86.133.104/peliculas/${this.pelicula._id}`) // Obtener la película por su ID
        .then((response) => {
          const pelicula = response.data;
          const peliculaId = pelicula._id;
          const fileUrlPelicula = pelicula.urlpelicula;
          const fileUrlImagen = pelicula.urlimagen;
          if (fileUrlPelicula) {
                axios
                  .delete(`http://52.86.133.104/files/${encodeURIComponent(fileUrlPelicula)}`) // Eliminar el archivo de la película
                  .then(() => {
                    if (this.archivoPelicula) {
                      const peliculaFormData = new FormData();
                        const config = {
                          headers: {
                            'Content-Type': this.archivoPelicula.type,
                            'Content-Disposition': 'inline'
                          },
                          
                        };
                        peliculaFormData.append('file', this.archivoPelicula, this.archivoPelicula.name);
                        peliculaFormData.append('Content-Type', this.archivoPelicula.type);
                        peliculaFormData.append('Content-Disposition', 'inline');
                        console.log('Content-Type:', this.archivoPelicula.type);
                        console.log('Content-Disposition:', 'inline');
                        axios
                          .post('http://52.86.133.104/files', peliculaFormData, config)
                          .then((peliculaFileResponse) => {
                            const peliculaFileName = this.archivoPelicula!.name;
                            const peliculaFileUrl = `https://multimediapfinal.s3.amazonaws.com/${peliculaFileName}`;
                            this.pelicula.urlpelicula = peliculaFileUrl;
                            axios
                                    .put(`http://52.86.133.104/peliculas/${this.pelicula._id}`, this.pelicula)
                                    .then((response) => {
                                      console.log('Película editada:', response.data);
                                      this.cargarPeliculas();
                                      this.resetFormulario();
                                      Swal.fire({
                                        title: 'Éxito',
                                        text: 'Registro editado satisfactoriamente',
                                        icon: 'success',
                                        confirmButtonText: 'Aceptar',
                                        customClass: {
                                          popup: 'netflix-alert',
                                          title: 'swal2-title',
                                          actions: 'swal2-actions',
                                          confirmButton: 'swal2-confirm',
                                          cancelButton: 'swal2-cancel'
                                        }
                                      }).then((result) => {
                                        
                                      }); 
                                    })
                          })
                    }
                    this.cargarPeliculas();

                  })
                  .catch((error) => {
                    console.error('Error al eliminar el archivo de la película:', error);
                  });
          }
        })
        .catch((error) => {
          console.error('Error al obtener las peliculas:', error);
        });
      }
      if(this.archivoImagen){
        axios
        .get(`http://52.86.133.104/peliculas/${this.pelicula._id}`) // Obtener la película por su ID
        .then((response) => {
          const pelicula = response.data;
          const peliculaId = pelicula._id;
          const fileUrlPelicula = pelicula.urlpelicula;
          const fileUrlImagen = pelicula.urlimagen;
          if (fileUrlImagen) {
            axios
              .delete(`http://52.86.133.104/files/${encodeURIComponent(fileUrlImagen)}`) // Eliminar el archivo de la imagen
              .then(() => {
                            if (this.archivoImagen) {
                              const imagenFormData = new FormData();
                                const config2 = {
                                  headers: {
                                    'Content-Type': this.archivoImagen.type,
                                    'Content-Disposition': 'inline'
                                  }
                                };
                                imagenFormData.append('file', this.archivoImagen, this.archivoImagen.name);
                                imagenFormData.append('Content-Type', this.archivoImagen.type);
                                imagenFormData.append('Content-Disposition', 'inline');
                                axios
                                .post('http://52.86.133.104/files', imagenFormData, config2)
                                .then((imagenFileResponse) => {
                                  const imagenFileName = this.archivoImagen!.name;
                                  const imagenFileUrl = `https://multimediapfinal.s3.amazonaws.com/${imagenFileName}`;
                                  this.pelicula.urlimagen = imagenFileUrl;
                                  axios
                                    .put(`http://52.86.133.104/peliculas/${this.pelicula._id}`, this.pelicula)
                                    .then((response) => {
                                      console.log('Película editada:', response.data);
                                      this.cargarPeliculas();
                                      this.resetFormulario();
                                      Swal.fire({
                                        title: 'Éxito',
                                        text: 'Registro editado satisfactoriamente',
                                        icon: 'success',
                                        confirmButtonText: 'Aceptar',
                                        customClass: {
                                          popup: 'netflix-alert',
                                          title: 'swal2-title',
                                          actions: 'swal2-actions',
                                          confirmButton: 'swal2-confirm',
                                          cancelButton: 'swal2-cancel'
                                        }
                                      }).then((result) => {
                                        
                                      }); 
                                    })
                                })
                            }
                    
                    this.cargarPeliculas();
              })
              .catch((error) => {
                console.error('Error al eliminar el archivo de imagen:', error);
              });
          }
        })
        .catch((error) => {
          console.error('Error al obtener las peliculas:', error);
        });
      }

      else{
        axios
          .put(`http://52.86.133.104/peliculas/${this.pelicula._id}`, this.pelicula)
          .then((response) => {
                console.log('Película editada:', response.data);
                this.cargarPeliculas();
                this.resetFormulario();
                Swal.fire({
                    title: 'Éxito',
                    text: 'Registro editado satisfactoriamente',
                    icon: 'success',
                    confirmButtonText: 'Aceptar',
                    customClass: {
                        popup: 'netflix-alert',
                        title: 'swal2-title',
                        actions: 'swal2-actions',
                        confirmButton: 'swal2-confirm',
                        cancelButton: 'swal2-cancel'
                    }
                }).then((result) => {
                          
                }); 
          })
      }
      
      
    } else {
      // Creación de una nueva película
      if (this.archivoPelicula) {
        const peliculaFormData = new FormData();
        const config = {
          headers: {
            'Content-Type': this.archivoPelicula.type,
            'Content-Disposition': 'inline'
          },
          
        };
        peliculaFormData.append('file', this.archivoPelicula, this.archivoPelicula.name);
        peliculaFormData.append('Content-Type', this.archivoPelicula.type);
        peliculaFormData.append('Content-Disposition', 'inline');
        console.log('Content-Type:', this.archivoPelicula.type);
        console.log('Content-Disposition:', 'inline');
        axios
          .post('http://52.86.133.104/files', peliculaFormData, config)
          .then((peliculaFileResponse) => {
            const peliculaFileName = this.archivoPelicula!.name;
            const peliculaFileUrl = `https://multimediapfinal.s3.amazonaws.com/${peliculaFileName}`;
            this.pelicula.urlpelicula = peliculaFileUrl;
  
            if (this.archivoImagen) {
              const imagenFormData = new FormData();
              const config2 = {
                headers: {
                  'Content-Type': this.archivoImagen.type,
                  'Content-Disposition': 'inline'
                }
              };
              imagenFormData.append('file', this.archivoImagen, this.archivoImagen.name);
              imagenFormData.append('Content-Type', this.archivoImagen.type);
              imagenFormData.append('Content-Disposition', 'inline');
              axios
                .post('http://52.86.133.104/files', imagenFormData, config2)
                .then((imagenFileResponse) => {
                  const imagenFileName = this.archivoImagen!.name;
                  const imagenFileUrl = `https://multimediapfinal.s3.amazonaws.com/${imagenFileName}`;
                  this.pelicula.urlimagen = imagenFileUrl;
  
                  axios
                    .post('http://52.86.133.104/peliculas', this.pelicula)
                    .then((response) => {
                      console.log('Película guardada:', response.data);
                      this.cargarPeliculas();
                      this.resetFormulario();
                      Swal.fire({
                        title: 'Éxito',
                        text: 'Registro guardado satisfactoriamente',
                        icon: 'success',
                        confirmButtonText: 'Aceptar',
                        customClass: {
                          popup: 'netflix-alert',
                          title: 'swal2-title',
                          actions: 'swal2-actions',
                          confirmButton: 'swal2-confirm',
                          cancelButton: 'swal2-cancel'
                        }
                      }).then((result) => {
                        
                      }); 
                    })
                    .catch((error) => {
                      console.error('Error al guardar la película:', error);
                    });
                })
                .catch((error) => {
                  console.error('Error al subir el archivo de imagen:', error);
                });
            } else {
              axios
                .post('http://52.86.133.104/peliculas', this.pelicula)
                .then((response) => {
                  console.log('Película guardada:', response.data);
                  this.cargarPeliculas();
                  this.resetFormulario();
                  Swal.fire({
                    title: 'Éxito',
                    text: 'Registro guardado satisfactoriamente',
                    icon: 'success',
                    confirmButtonText: 'Aceptar',
                    customClass: {
                      popup: 'netflix-alert',
                      title: 'swal2-title',
                      actions: 'swal2-actions',
                      confirmButton: 'swal2-confirm',
                      cancelButton: 'swal2-cancel'
                    }
                  }).then((result) => {
                    
                  }); 
                })
                .catch((error) => {
                  console.error('Error al guardar la película:', error);
                });
            }
          })
          .catch((error) => {
            console.error('Error al subir el archivo de película:', error);
          });
      } else {
        if (this.archivoImagen) {
          const imagenFormData = new FormData();
          imagenFormData.append('file', this.archivoImagen, this.archivoImagen.name);
  
          axios
            .post('http://52.86.133.104/files', imagenFormData)
            .then((imagenFileResponse) => {
              const imagenFileName = this.archivoImagen!.name;
              const imagenFileUrl = `https://multimediapfinal.s3.amazonaws.com/${imagenFileName}`;
              this.pelicula.urlimagen = imagenFileUrl;
  
              axios
                .post('http://52.86.133.104/peliculas', this.pelicula)
                .then((response) => {
                  console.log('Película guardada:', response.data);
                  this.cargarPeliculas();
                  this.resetFormulario();
                  Swal.fire({
                    title: 'Éxito',
                    text: 'Registro guardado satisfactoriamente',
                    icon: 'success',
                    confirmButtonText: 'Aceptar',
                    customClass: {
                      popup: 'netflix-alert',
                      title: 'swal2-title',
                      actions: 'swal2-actions',
                      confirmButton: 'swal2-confirm',
                      cancelButton: 'swal2-cancel'
                    }
                  }).then((result) => {
                    
                  }); 
                })
                .catch((error) => {
                  console.error('Error al guardar la película:', error);
                });
            })
            .catch((error) => {
              console.error('Error al subir el archivo de imagen:', error);
            });
        } else {
          axios
            .post('http://52.86.133.104/peliculas', this.pelicula)
            .then((response) => {
              console.log('Película guardada:', response.data);
              this.cargarPeliculas();
              this.resetFormulario();
              Swal.fire({
                title: 'Éxito',
                text: 'Registro guardado satisfactoriamente',
                icon: 'success',
                confirmButtonText: 'Aceptar',
                customClass: {
                  popup: 'netflix-alert',
                  title: 'swal2-title',
                  actions: 'swal2-actions',
                  confirmButton: 'swal2-confirm',
                  cancelButton: 'swal2-cancel'
                }
              }).then((result) => {
                
              }); 
            })
            .catch((error) => {
              console.error('Error al guardar la película:', error);
            });
        }
      }
      
    }
  }

  editarPelicula(pelicula: any) {
      this.pelicula = { ...pelicula };
      this.categoriaSeleccionada = pelicula.categoria._id;
      this.pelicula.categoria = this.categoriaSeleccionada;
      this.anopublic = pelicula.añopublic;
      this.elenco = [...this.pelicula.elenco];
  }
  eliminarPelicula(id: string) {
    Swal.fire({
      title: 'Eliminar Película',
      text: '¿Estás seguro de que quieres eliminar esta película?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No',
      customClass: {
        popup: 'netflix-alert',
        title: 'swal2-title',
        actions: 'swal2-actions',
        confirmButton: 'swal2-confirm',
        cancelButton: 'swal2-cancel'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .get(`http://52.86.133.104/peliculas/${id}`) // Obtener la película por su ID
          .then((response) => {
            const pelicula = response.data;
            const peliculaId = pelicula._id;
            const fileUrlPelicula = pelicula.urlpelicula;
            const fileUrlImagen = pelicula.urlimagen;
  
            if (fileUrlImagen) {
              axios
                .delete(`http://52.86.133.104/files/${encodeURIComponent(fileUrlImagen)}`) // Eliminar el archivo de la imagen
                .then(() => {
                  axios
                    .delete(`http://52.86.133.104/files/${encodeURIComponent(fileUrlPelicula)}`) // Eliminar el archivo de la película
                    .then(() => {
                      axios
                        .delete(`http://52.86.133.104/peliculas/${peliculaId}`) // Eliminar la película
                        .then(() => {
                          Swal.fire({
                            title: 'Éxito',
                            text: 'Registro eliminado satisfactoriamente',
                            icon: 'success',
                            confirmButtonText: 'Aceptar',
                            customClass: {
                              popup: 'netflix-alert',
                              title: 'swal2-title',
                              actions: 'swal2-actions',
                              confirmButton: 'swal2-confirm',
                              cancelButton: 'swal2-cancel'
                            }
                          }).then(() => {
                            console.log('Película eliminada:', pelicula);
                            this.cargarPeliculas();
                          });
                        })
                        .catch((error) => {
                          console.error('Error al eliminar la película:', error);
                        });
                    })
                    .catch((error) => {
                      console.error('Error al eliminar el archivo de la película:', error);
                    });
                })
                .catch((error) => {
                  console.error('Error al eliminar el archivo de imagen:', error);
                });
            } else {
              axios
                .delete(`http://52.86.133.104/files/${encodeURIComponent(fileUrlPelicula)}`) // Eliminar el archivo de la película
                .then(() => {
                  axios
                    .delete(`http://52.86.133.104/peliculas/${peliculaId}`) // Eliminar la película
                    .then(() => {
                      Swal.fire({
                        title: 'Éxito',
                        text: 'Registro eliminado satisfactoriamente',
                        icon: 'success',
                        confirmButtonText: 'Aceptar',
                        customClass: {
                          popup: 'netflix-alert',
                          title: 'swal2-title',
                          actions: 'swal2-actions',
                          confirmButton: 'swal2-confirm',
                          cancelButton: 'swal2-cancel'
                        }
                      }).then(() => {
                        console.log('Película eliminada:', pelicula);
                        this.cargarPeliculas();
                      });
                    })
                    .catch((error) => {
                      console.error('Error al eliminar la película:', error);
                    });
                })
                .catch((error) => {
                  console.error('Error al eliminar el archivo de la película:', error);
                });
            }
          })
          .catch((error) => {
            console.error('Error al obtener la película:', error);
          });
      }
    });
  }
  
  
  resetFormulario() {
    this.pelicula = {
      nombre: '',
      descripcion: '',
      urlpelicula: '',
      urlimagen: '',
      categoria: '',
      duracion: '',
      director: '',
      elenco: [],
    };
    this.anopublic = null;
    this.pelicula.elenco = [];
  }
  filtrarPorBusqueda(busqueda: string) {
    // Aplica la lógica para filtrar las películas según la búsqueda
    // Utiliza la variable `busqueda` para realizar la búsqueda en tus datos
    
    // Ejemplo:
    this.peliculasFiltradas = this.peliculas.filter(pelicula =>
      pelicula.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );
  }
  
  limpiarBusqueda() {
    this.busqueda = '';
    this.filtrarPorBusqueda('');
  }
}
