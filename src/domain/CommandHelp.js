class CommandHelp {
    /**
     * 
     * @param {string} name Name of the command
     * @param {string} aliases Other ways to invoke the command
     * @param {string} helpText Command description
     */
    constructor(name, aliases, helpText) {
        /**
         * @type {string}
         */
        this.name = name;
        /**
         * @type {string}
         */
        this.aliases = aliases;
        /**
         * @type {string}
         */
        this.helpText = helpText;
    }
}

module.exports = CommandHelp;
