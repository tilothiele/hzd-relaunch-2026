package de.hzd.importer.domain;

public class ImportStatistics {

    private int membersRead;
    private int dogsRead;
    private int breedersIdentified;

    public void incrementMembersRead(int count) {
        this.membersRead += count;
    }

    public void incrementDogsRead(int count) {
        this.dogsRead += count;
    }

    public void incrementBreedersIdentified(int count) {
        this.breedersIdentified += count;
    }

    public int getMembersRead() {
        return membersRead;
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
            "membersRead=" + membersRead +
            ", dogsRead=" + dogsRead +
            ", breedersIdentified=" + breedersIdentified +
            '}';
    }
}
