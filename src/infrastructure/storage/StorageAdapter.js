/**
 * Interfaz base para adaptadores de almacenamiento.
 * Todos los adapters deben implementar estos métodos.
 */
class StorageAdapter {
    constructor(config) {
        this.config = config;
    }

    /**
     * Guarda un stream o buffer en la ubicación destino.
     * @param {string} relativePath Ruta relativa dentro del storage (ej: "2024/doc.pdf")
     * @param {Buffer|Stream} content Contenido del archivo
     * @returns {Promise<object>} Metadata del archivo guardado (path, size, etc)
     */
    async save(relativePath, content) { throw new Error('Not implemented'); }

    /**
     * Obtiene un stream de lectura del archivo.
     * @param {string} relativePath 
     * @returns {Promise<Stream>} Readable stream
     */
    async getStream(relativePath) { throw new Error('Not implemented'); }

    /**
     * Elimina un archivo.
     * @param {string} relativePath 
     */
    async delete(relativePath) { throw new Error('Not implemented'); }

    /**
     * Verifica si existe.
     * @param {string} relativePath 
     */
    async exists(relativePath) { throw new Error('Not implemented'); }

    /**
     * Mueve un archivo internamente (optimización si es mismo adapter).
     * @param {string} sourcePath 
     * @param {string} targetPath 
     */
    async move(sourcePath, targetPath) { throw new Error('Not implemented'); }
}

module.exports = StorageAdapter;
