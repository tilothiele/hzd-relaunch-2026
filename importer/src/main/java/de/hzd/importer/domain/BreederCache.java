package de.hzd.importer.domain;

import jakarta.enterprise.context.ApplicationScoped;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@ApplicationScoped
public class BreederCache {

    private final Map<Integer, Breeder> breedersByCId = new HashMap<>();

    public void add(Breeder breeder) {
        breeder.getCId().ifPresent(cId -> breedersByCId.put(cId, breeder));
    }

    public void addAll(List<Breeder> breeders) {
        breeders.forEach(this::add);
    }

    public Optional<Breeder> findByCId(Integer cId) {
        return Optional.ofNullable(breedersByCId.get(cId));
    }

    public List<Breeder> getAll() {
        return new ArrayList<>(breedersByCId.values());
    }

    public int size() {
        return breedersByCId.size();
    }

    public void clear() {
        breedersByCId.clear();
    }

    public void populateFromDogCache(DogCache dogCache) {
        Set<Integer> breederCIds = new HashSet<>();
        for (Dog dog : dogCache.getAll()) {
            dog.getBreederCId().ifPresent(breederCIds::add);
        }

        for (Integer breederCId : breederCIds) {
            Breeder breeder = Breeder.builder()
                .cId(breederCId)
                .build();
            add(breeder);
        }
    }
}
