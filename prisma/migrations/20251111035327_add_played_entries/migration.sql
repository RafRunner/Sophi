-- CreateTable
CREATE TABLE "played_entries" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "serverId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "youtubeUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "channelName" TEXT,
    "durationRaw" TEXT,
    "durationInSeconds" INTEGER,
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "playedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "playedInFull" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "played_entries_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "servers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "played_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
