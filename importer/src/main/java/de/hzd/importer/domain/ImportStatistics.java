package de.hzd.importer.domain;

public class ImportStatistics {

    private int strapiUsersRead;
    private int authentikUsersRead;
    private int dogsRead;
    private int breedersIdentified;

    public void incrementStrapiUsersRead(int count) {
        this.strapiUsersRead += count;
    }

    public void incrementAuthentikUsersRead(int count) {
        this.authentikUsersRead += count;
    }

    public void incrementDogsRead(int count) {
        this.dogsRead += count;
    }

    public void incrementBreedersIdentified(int count) {
        this.breedersIdentified += count;
    }

    public int getStrapiUsersRead() {
        return strapiUsersRead;
    }

    public int getAuthentikUsersRead() {
        return authentikUsersRead;
    }

    public int getDogsRead() {
        return dogsRead;
    }

    public int getBreedersIdentified() {
        return breedersIdentified;
    }

    @Override
    public String toString() {
        return "ImportStatistics{" +
            "strapiUsersRead=" + strapiUsersRead +
            ", authentikUsersRead=" + authentikUsersRead +
            ", dogsRead=" + dogsRead +
            ", breedersIdentified=" + breedersIdentified +
            '}';
    }
}