package com.enviro.assessment.junior.eleazar.repository;

import com.enviro.assessment.junior.eleazar.entity.InvestmentProduct;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface InvestmentProductRepository extends JpaRepository<InvestmentProduct, Long> {
    List<InvestmentProduct> findByPortfolioInvestorIdOrderByIdAsc(Long investorId);

    // All reservation writers must take this product lock BEFORE reading the
    // pending sum. READ_COMMITTED then sees the preceding writer's committed notice.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from InvestmentProduct p where p.id = :productId and p.portfolio.investor.id = :investorId")
    Optional<InvestmentProduct> findForWithdrawal(@Param("investorId") Long investorId,
                                                @Param("productId") Long productId);
}
