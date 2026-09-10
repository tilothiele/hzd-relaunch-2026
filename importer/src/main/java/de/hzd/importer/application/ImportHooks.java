package de.hzd.importer.application;

import de.hzd.importer.adapter.strapi.StrapiDogAdapter;
import de.hzd.importer.adapter.strapi.StrapiMemberAdapter;
import de.hzd.importer.adapter.strapi.StrapiMemberAdapter.StrapiMemberSnapshot;
import de.hzd.importer.adapter.strapi.StrapiUserGroupAdapter;
import de.hzd.importer.domain.Dog;
import de.hzd.importer.domain.Member;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class ImportHooks {

	@Inject
	StrapiMemberAdapter memberCache;

	@Inject
	StrapiDogAdapter dogCache;

	@Inject
	StrapiUserGroupAdapter userGroupCache;

	public boolean needUpsertUser(Member user) {
		if(user==null) return false;
		StrapiMemberSnapshot cachedUser = memberCache.cachedMemberByCid(user.cId());
		if(cachedUser==null) return true;
		return true;
	}

	public boolean needUpsertDog(Dog dog) {
		if(dog==null) return false;
		StrapiDogAdapter.StrapiDogSnapshot cachedDog = dogCache.getCachedDogByCid(dog.cId());
		if(cachedDog==null) return true;
		return true;
	}

	public boolean needUpsertBreeder(Member breeder) {
		return true;
	}
}
