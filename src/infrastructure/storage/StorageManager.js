const LocalStorageAdapter = require('./LocalStorageAdapter');

class StorageManager {
    constructor() {
        this.adapters = new Map();
        // Inicializar adapter por defecto (LOCAL)
        // Se podría cargar config de .env para tener varios named adapters
        const defaultPath = process.env.STORAGE_PATH || 'uploads';
        this.registerAdapter('LOCAL', new LocalStorageAdapter(defaultPath));
    }

    registerAdapter(name, adapter) {
        this.adapters.set(name, adapter);
    }

    getAdapter(name = 'LOCAL') {
        const adapter = this.adapters.get(name);
        if (!adapter) {
            throw new Error(`Storage adapter '${name}' not found`);
        }
        return adapter;
    }

    /**
     * Mueve archivo entre storages (incluso distintos tipos)
     */
    async moveFile(sourceAdapterName, sourcePath, targetAdapterName, targetPath) {
        const sourceAdapter = this.getAdapter(sourceAdapterName);
        const targetAdapter = this.getAdapter(targetAdapterName);

        // Optimización: Si es el mismo adapter y soporta move nativo
        if (sourceAdapter === targetAdapter && sourceAdapter.move) {
            return await sourceAdapter.move(sourcePath, targetPath);
        }

        // Cross-storage move: Read Stream -> Write Stream -> Delete Source
        const readStream = await sourceAdapter.getStream(sourcePath);
        const result = await targetAdapter.save(targetPath, readStream);
        await sourceAdapter.delete(sourcePath);

        return result;
    }
}

module.exports = new StorageManager(); // Singleton
